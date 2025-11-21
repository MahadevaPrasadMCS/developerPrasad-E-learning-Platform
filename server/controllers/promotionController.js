// server/controllers/promotionController.js
import PromotionRequest from "../models/PromotionRequest.js";
import User from "../models/User.js";
import { ROLES } from "../config/roles.js";
import { supabase } from "../utils/supabaseClient.js";
import { logAction } from "../utils/logAction.js";

const COOLDOWN_DAYS = 30;
const INTERVIEW_BUCKET =
  process.env.SUPABASE_INTERVIEW_BUCKET || "interview-proofs";

/* ------------------------------------------------------------------
 * Helper: compute next role in ladder (Student → Instructor → Moderator → Admin)
 * CEO is NOT part of auto-promotion flow.
 * ------------------------------------------------------------------ */
function getNextRole(currentRole) {
  if (currentRole === ROLES.STUDENT) return ROLES.INSTRUCTOR;
  if (currentRole === ROLES.INSTRUCTOR) return ROLES.MODERATOR;
  if (currentRole === ROLES.MODERATOR) return ROLES.ADMIN;
  return null; // Admin & CEO cannot auto-request further in this flow
}

/* ------------------------------------------------------------------
 * 1️⃣ USER → Request Promotion  (POST /api/promotions)
 * ------------------------------------------------------------------ */
export const requestPromotion = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.role === ROLES.CEO) {
      return res.status(403).json({ message: "CEO cannot request promotion" });
    }

    // Determine target role based on ladder
    const requestedRole = getNextRole(user.role);
    if (!requestedRole) {
      return res.status(400).json({
        message: "Your current role is not eligible for promotion via this flow",
      });
    }

    // Check latest request for cooldown
    const latestRequest = await PromotionRequest.findOne({ user: user._id })
      .sort({ createdAt: -1 });

    if (
      latestRequest?.cooldownEndsAt &&
      latestRequest.cooldownEndsAt > new Date()
    ) {
      return res.status(400).json({
        message: "You must wait before requesting again",
        nextAllowedDate: latestRequest.cooldownEndsAt,
      });
    }

    // Prevent new request if there is any active one
    const active = await PromotionRequest.findOne({
      user: user._id,
      status: { $nin: ["approved", "rejected"] },
    });

    if (active) {
      return res.status(400).json({
        message: "You already have an active promotion request",
      });
    }

    const interviewRequired = requestedRole === ROLES.ADMIN;

    const newReq = await PromotionRequest.create({
      user: user._id,
      currentRole: user.role,
      requestedRole,
      status: "pending",
      interview: {
        required: interviewRequired,
        confirmedByStaff: false,
        confirmedByUser: "pending",
      },
    });

    await logAction({
      action: "ROLE_UPDATE",
      actor: user._id,
      target: user._id,
      details: {
        kind: "PROMOTION_REQUEST",
        from: user.role,
        to: requestedRole,
        initiatedBy: "user",
      },
      ip: req.ip,
    });

    res.status(201).json({
      message: "Promotion request submitted successfully",
      request: newReq,
    });
  } catch (err) {
    console.error("requestPromotion error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------------------------
 * 2️⃣ CEO → Initiate Promotion for a User  (POST /api/promotions/ceo-initiate)
 * ------------------------------------------------------------------ */
export const ceoInitiatePromotion = async (req, res) => {
  try {
    const ceo = req.user;
    const { userId, requestedRole } = req.body;

    if (!userId || !requestedRole) {
      return res
        .status(400)
        .json({ message: "userId and requestedRole are required" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.role === ROLES.CEO) {
      return res
        .status(403)
        .json({ message: "Cannot run promotion flow on CEO account" });
    }

    if (!Object.values(ROLES).includes(requestedRole)) {
      return res.status(400).json({ message: "Invalid requested role" });
    }

    // Disallow automatic CEO promotion via this system
    if (requestedRole === ROLES.CEO) {
      return res
        .status(400)
        .json({ message: "CEO role cannot be assigned via promotion flow" });
    }

    // No active promotion already
    const active = await PromotionRequest.findOne({
      user: targetUser._id,
      status: { $nin: ["approved", "rejected"] },
    });

    if (active) {
      return res.status(400).json({
        message: "User already has an active promotion request",
      });
    }

    const interviewRequired = requestedRole === ROLES.ADMIN;

    const request = await PromotionRequest.create({
      user: targetUser._id,
      currentRole: targetUser.role,
      requestedRole,
      status: "awaiting_user_confirmation", // user will acknowledge/join flow
      interview: {
        required: interviewRequired,
        confirmedByStaff: false,
        confirmedByUser: "pending",
      },
      decision: {
        reason: "CEO initiated promotion flow",
      },
    });

    await logAction({
      action: "ROLE_UPDATE",
      actor: ceo._id,
      target: targetUser._id,
      details: {
        kind: "CEO_INITIATED_PROMOTION",
        from: targetUser.role,
        to: requestedRole,
      },
      ip: req.ip,
    });

    res.status(201).json({
      message: "Promotion flow initiated for user",
      request,
    });
  } catch (err) {
    console.error("ceoInitiatePromotion error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------------------------
 * 3️⃣ CEO/Admin → List Promotion Requests  (GET /api/promotions)
 * ------------------------------------------------------------------ */
export const getAllPromotionRequests = async (req, res) => {
  try {
    const { status, role } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (role) filter.requestedRole = role;

    const requests = await PromotionRequest.find(filter)
      .populate("user", "name email role")
      .populate("decision.decidedBy", "name email role")
      .populate("interview.completedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("getAllPromotionRequests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------------------------
 * 4️⃣ CEO/Admin → Schedule Interview  (PATCH /api/promotions/:id/interview)
 * ------------------------------------------------------------------ */
export const scheduleInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledAt, mode, meetingLink, location, notes } = req.body;

    const request = await PromotionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (!["pending", "under_review", "awaiting_user_confirmation"].includes(request.status)) {
      return res.status(400).json({
        message: "Interview cannot be scheduled in current state",
      });
    }

    request.status = "interview_scheduled";
    request.interview.required = true;
    request.interview.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    request.interview.mode = mode || request.interview.mode;
    request.interview.meetingLink = meetingLink || request.interview.meetingLink;
    request.interview.location = location || request.interview.location;
    request.interview.notes = notes || request.interview.notes;

    await request.save();

    await logAction({
      action: "ROLE_UPDATE",
      actor: req.user._id,
      target: request.user,
      details: {
        kind: "INTERVIEW_SCHEDULED",
        requestId: request._id,
        scheduledAt: request.interview.scheduledAt,
        mode: request.interview.mode,
      },
      ip: req.ip,
    });

    res.json({ message: "Interview scheduled successfully", request });
  } catch (err) {
    console.error("scheduleInterview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------------------------
 * 5️⃣ CEO/Admin → Mark Interview Completed + Upload Proof (Supabase)
 *     PATCH /api/promotions/:id/interview-complete
 * ------------------------------------------------------------------ */
export const completeInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { proofUrl } = req.body; // optional: front-end may upload to supabase and send URL

    const request = await PromotionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "interview_scheduled") {
      return res.status(400).json({
        message: "Interview is not in a schedulable state to be completed",
      });
    }

    let finalProofUrl = proofUrl || null;
    let filePath = null;

    // Optional: if you later add multer, you can handle req.file here
    if (!finalProofUrl && req.file) {
      try {
        filePath = `${request.user}/${id}/${Date.now()}-${req.file.originalname}`;

        const { error: uploadError } = await supabase.storage
          .from(INTERVIEW_BUCKET)
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error("Supabase upload error:", uploadError);
        } else {
          const { data: publicData } = supabase.storage
            .from(INTERVIEW_BUCKET)
            .getPublicUrl(filePath);

          finalProofUrl = publicData?.publicUrl || null;
        }
      } catch (e) {
        console.error("Supabase storage unexpected error:", e);
      }
    }

    request.status = "interview_completed";
    request.interview.completedAt = new Date();
    request.interview.completedBy = req.user._id;
    request.interview.confirmedByStaff = true;

    // Store proof meta if any URL available
    if (finalProofUrl) {
      request.interview.proof = {
        bucket: INTERVIEW_BUCKET,
        path: filePath,
        url: finalProofUrl,
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
      };
    }

    await request.save();

    await logAction({
      action: "ROLE_UPDATE",
      actor: req.user._id,
      target: request.user,
      details: {
        kind: "INTERVIEW_COMPLETED",
        requestId: request._id,
        proofUrl: finalProofUrl,
      },
      ip: req.ip,
    });

    res.json({ message: "Interview marked as completed", request });
  } catch (err) {
    console.error("completeInterview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------------------------
 * 6️⃣ USER → Confirm Interview Happened (yes/no)
 *     PATCH /api/promotions/:id/confirm
 * ------------------------------------------------------------------ */
export const confirmInterviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirm } = req.body; // "yes" | "no"

    const request = await PromotionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your request" });
    }

    if (request.status !== "interview_completed") {
      return res.status(400).json({
        message: "Interview is not in a state that can be confirmed",
      });
    }

    if (!["yes", "no"].includes(confirm)) {
      return res
        .status(400)
        .json({ message: "Confirm must be 'yes' or 'no'" });
    }

    request.interview.confirmedByUser = confirm;

    // If user confirms, move back to under_review for CEO final verdict
    request.status = confirm === "yes" ? "under_review" : "disputed";

    await request.save();

    await logAction({
      action: "ROLE_UPDATE",
      actor: req.user._id,
      target: req.user._id,
      details: {
        kind: "INTERVIEW_CONFIRMATION",
        requestId: request._id,
        confirm,
      },
      ip: req.ip,
    });

    res.json({ message: "Interview confirmation updated", request });
  } catch (err) {
    console.error("confirmInterviewStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------------------------
 * 7️⃣ CEO → Approve Promotion (PATCH /api/promotions/:id/approve)
 *     Actually updates user.role
 * ------------------------------------------------------------------ */
export const approvePromotion = async (req, res) => {
  try {
    const request = await PromotionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "approved") {
      return res.status(400).json({ message: "Request already approved" });
    }

    if (request.status === "rejected") {
      return res.status(400).json({ message: "Request already rejected" });
    }

    const user = await User.findById(request.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Never allow auto-CEO promotion from here
    if (request.requestedRole === ROLES.CEO) {
      return res
        .status(400)
        .json({ message: "CEO promotion must be handled manually" });
    }

    user.role = request.requestedRole;
    await user.save();

    request.status = "approved";
    request.decision = {
      decidedBy: req.user._id,
      decidedAt: new Date(),
      reason: req.body.reason || "Promotion approved",
    };

    await request.save();

    await logAction({
      action: "ROLE_UPDATE",
      actor: req.user._id,
      target: user._id,
      details: {
        kind: "PROMOTION_APPROVED",
        requestId: request._id,
        from: request.currentRole,
        to: request.requestedRole,
      },
      ip: req.ip,
    });

    res.json({ message: "Promotion approved", request });
  } catch (err) {
    console.error("approvePromotion error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------------------------
 * 8️⃣ CEO → Reject Promotion (PATCH /api/promotions/:id/reject)
 *     Sets cooldown before next request.
 * ------------------------------------------------------------------ */
export const rejectPromotion = async (req, res) => {
  try {
    const request = await PromotionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "approved") {
      return res.status(400).json({ message: "Already approved" });
    }

    if (request.status === "rejected") {
      return res.status(400).json({ message: "Already rejected" });
    }

    const nextAllowedDate = new Date();
    nextAllowedDate.setDate(nextAllowedDate.getDate() + COOLDOWN_DAYS);

    request.status = "rejected";
    request.cooldownEndsAt = nextAllowedDate;
    request.decision = {
      decidedBy: req.user._id,
      decidedAt: new Date(),
      reason: req.body.reason || "Promotion not approved",
    };

    await request.save();

    await logAction({
      action: "ROLE_UPDATE",
      actor: req.user._id,
      target: request.user,
      details: {
        kind: "PROMOTION_REJECTED",
        requestId: request._id,
        cooldownEndsAt: nextAllowedDate,
      },
      ip: req.ip,
    });

    res.json({
      message: `Promotion rejected. Next request allowed on ${nextAllowedDate.toISOString()}`,
      request,
    });
  } catch (err) {
    console.error("rejectPromotion error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
