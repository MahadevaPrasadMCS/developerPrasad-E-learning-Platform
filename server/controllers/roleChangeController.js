// server/controllers/roleChangeController.js
import RoleChangeRequest from "../models/RoleChangeRequest.js";
import User from "../models/User.js";
import SystemLog from "../models/SystemLog.js";
import { ROLES } from "../config/roles.js";

// CEO/Admin starts demotion
export const initiateDemotion = async (req, res) => {
  try {
    const { userId, newRole, reason } = req.body;

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ message: "Reason must be at least 10 characters" });
    }

    if (targetUser.role === ROLES.CEO) {
      return res.status(403).json({ message: "CEO cannot be demoted" });
    }

    const existingActive = await RoleChangeRequest.findOne({
      user: userId,
      status: { $in: ["PENDING_USER_REVIEW", "USER_ACCEPTED", "USER_DISPUTED"] }
    });

    if (existingActive) {
      return res.status(400).json({
        message: "User already has an active demotion request"
      });
    }

    const request = await RoleChangeRequest.create({
      user: userId,
      currentRole: targetUser.role,
      newRole,
      reason,
      initiatedBy: req.user._id,
    });

    await SystemLog.create({
      actor: req.user._id,
      action: "INITIATE_DEMOTION",
      targetUser: userId,
      details: { newRole, reason }
    });

    res.status(201).json({
      message: "Demotion request initiated and pending user review",
      request
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// User action: Accept/Dispute
export const userRespondDemotion = async (req, res) => {
  try {
    const { confirm, disputeNote } = req.body;
    const request = await RoleChangeRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "This is not your request" });
    }

    if (request.status !== "PENDING_USER_REVIEW") {
      return res.status(400).json({ message: "Cannot update this request now" });
    }

    if (confirm === true) {
      request.status = "USER_ACCEPTED";
      request.userResponse = "accepted";
    } else {
      request.status = "USER_DISPUTED";
      request.userResponse = "disputed";
      if (disputeNote) request.disputeNote = disputeNote;
    }

    request.lastUpdatedBy = req.user._id;
    await request.save();

    await SystemLog.create({
      actor: req.user._id,
      action: confirm ? "ACCEPT_DEMOTION" : "DISPUTE_DEMOTION",
      targetUser: req.user._id,
      details: { disputeNote }
    });

    res.json({ message: "Response recorded", request });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Final approval from CEO/Admin
export const finalizeDemotion = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await RoleChangeRequest.findById(id);

    if (!request) return res.status(404).json({ message: "Request not found" });

    if (!["USER_ACCEPTED", "USER_DISPUTED"].includes(request.status)) {
      return res.status(400).json({ message: "Request is not ready for final action" });
    }

    const user = await User.findById(request.user);
    user.role = request.newRole;
    await user.save();

    request.status = "FINALIZED";
    request.finalizedBy = req.user._id;
    request.lastUpdatedBy = req.user._id;
    await request.save();

    await SystemLog.create({
      actor: req.user._id,
      action: "FINALIZE_DEMOTION",
      targetUser: request.user,
      details: { newRole: request.newRole }
    });

    res.json({ message: "Role demotion finalized", request });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// CEO/Admin cancel demotion request
export const cancelDemotion = async (req, res) => {
  try {
    const request = await RoleChangeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "CANCELLED";
    request.lastUpdatedBy = req.user._id;
    await request.save();

    await SystemLog.create({
      actor: req.user._id,
      action: "CANCEL_DEMOTION",
      targetUser: request.user,
    });

    res.json({ message: "Demotion cancelled", request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// CEO/Admin get all requests
export const listDemotionRequests = async (req, res) => {
  const list = await RoleChangeRequest.find()
    .populate("user", "name email role")
    .populate("initiatedBy", "name email role")
    .sort({ createdAt: -1 });
  res.json(list);
};


// User: Get my demotion requests
export const myDemotionRequest = async (req, res) => {
  const myReq = await RoleChangeRequest.findOne({ user: req.user._id })
    .sort({ createdAt: -1 });
  res.json(myReq || {});
};
