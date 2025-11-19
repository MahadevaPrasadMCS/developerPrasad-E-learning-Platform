import express from "express";
import User from "../models/User.js";
import ProfileChangeRequest from "../models/ProfileChangeRequest.js";
import AdminLog from "../models/AdminLog.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

/* =========================================================
   1️⃣ FETCH ALL ADMINS ONLY
========================================================= */
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }, "-password").sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({ message: "Failed to fetch admin users." });
  }
});

/* =========================================================
   2️⃣ DELETE ADMIN ACCOUNT
========================================================= */
router.delete("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Admin not found." });
    if (user.role !== "admin")
      return res.status(403).json({ message: "Cannot delete non-admin users here." });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: `Admin ${user.name} deleted successfully.` });
  } catch (err) {
    console.error("Error deleting admin:", err);
    res.status(500).json({ message: "Failed to delete admin." });
  }
});

// 🧾 ADMIN: List profile change requests
router.get("/profile-change-requests", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    const requests = await ProfileChangeRequest.find(query)
      .populate("user", "name email")
      .populate("handledBy", "name email")
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Failed to fetch profile change requests:", err);
    res.status(500).json({ message: "Failed to fetch profile change requests." });
  }
});

// ✅ ADMIN: Approve profile change request & apply changes
router.patch(
  "/profile-change-requests/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const admin = req.user;
      const request = await ProfileChangeRequest.findById(req.params.id).populate(
        "user"
      );

      if (!request) {
        return res.status(404).json({ message: "Request not found." });
      }
      if (request.status !== "pending") {
        return res.status(400).json({ message: "Request is not pending." });
      }

      const user = request.user;
      if (!user) {
        return res.status(404).json({ message: "User not found for this request." });
      }

      // Apply each requested field
      for (const f of request.fields) {
        if (f.field === "name") {
          user.name = f.newValue;
        }
        if (f.field === "email") {
          // Double check uniqueness again
          const existingEmail = await User.findOne({
            email: f.newValue.toLowerCase(),
            _id: { $ne: user._id },
          });
          if (existingEmail) {
            return res.status(400).json({
              message: `Cannot update email. ${f.newValue} is already in use.`,
            });
          }
          user.email = f.newValue.toLowerCase();
        }
      }

      await user.save();

      request.status = "approved";
      request.resolvedAt = new Date();
      request.handledBy = admin._id;
      await request.save();

      // Admin log entry
      if (AdminLog) {
        try {
          await AdminLog.create({
            admin: admin._id,
            targetUser: user._id,
            action: "approve_profile_change",
            details: `Approved profile change for ${user.email}`,
          });
        } catch (err) {
          console.error("Failed to log admin action (approve_profile_change):", err);
        }
      }

      res.json({
        message: "Profile updated successfully.",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        request,
      });
    } catch (err) {
      console.error("Approve profile change failed:", err);
      res.status(500).json({
        message: "Failed to approve profile change request.",
      });
    }
  }
);

// ❌ ADMIN: Reject profile change request
// body: { reason?: string }
router.patch(
  "/profile-change-requests/:id/reject",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const admin = req.user;
      const { reason } = req.body;

      const request = await ProfileChangeRequest.findById(req.params.id).populate(
        "user"
      );

      if (!request) {
        return res.status(404).json({ message: "Request not found." });
      }
      if (request.status !== "pending") {
        return res.status(400).json({ message: "Request is not pending." });
      }

      request.status = "rejected";
      request.resolvedAt = new Date();
      request.handledBy = admin._id;
      request.rejectionReason = reason || "No reason provided.";
      await request.save();

      // Admin log entry
      if (AdminLog) {
        try {
          await AdminLog.create({
            admin: admin._id,
            targetUser: request.user?._id,
            action: "reject_profile_change",
            details: `Rejected profile change request. Reason: ${
              request.rejectionReason
            }`,
          });
        } catch (err) {
          console.error("Failed to log admin action (reject_profile_change):", err);
        }
      }

      res.json({
        message: "Profile change request rejected.",
        request,
      });
    } catch (err) {
      console.error("Reject profile change failed:", err);
      res.status(500).json({
        message: "Failed to reject profile change request.",
      });
    }
  }
);


export default router;
