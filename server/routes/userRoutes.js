import express from "express";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import AdminLog from "../models/AdminLog.js";
import ProfileChangeRequest from "../models/ProfileChangeRequest.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
👤 GET ALL USERS (Admin only)
========================================================= */
router.get("/", adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", adminMiddleware, async (req, res) => {
  try {
    const admin = req.user;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin accounts cannot be deleted."
      });
    }

    const userEmail = user.email; // Save before deleting

    // Delete wallet and transactions
    await Wallet.deleteOne({ user: user._id });

    // Delete the user profile completely
    await User.deleteOne({ _id: user._id });

    // Update previous admin logs referencing deleted user
    await AdminLog.updateMany(
      { targetUser: user._id },
      {
        $set: {
          targetUser: null,
          details: `User deleted: ${userEmail.replace(/(.{3}).+(@.+)/, "$1****$2")}`
        }
      }
    );

    // Log this deletion action
    await AdminLog.create({
      admin: admin._id,
      action: "delete_user",
      details: `Permanently deleted user: ${userEmail}`
    });

    res.json({ message: "User removed permanently from all records." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
💰 UPDATE COINS (Admin only)
========================================================= */
router.patch("/coins/:id", adminMiddleware, async (req, res) => {
  try {
    const { change } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.coins = Math.max(0, user.coins + change);
    await user.save();

    // 🪙 Sync Wallet Transactions
    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) wallet = new Wallet({ user: user._id, transactions: [] });

    wallet.transactions.push({
      type: change > 0 ? "earn" : "spend",
      amount: Math.abs(change),
      description: `Admin ${change > 0 ? "rewarded" : "deducted"} coins`,
    });
    await wallet.save();

    res.json({
      message: `User ${change > 0 ? "rewarded" : "deducted"} successfully.`,
      coins: user.coins,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
🚫 TOGGLE BLOCK / UNBLOCK USER (Admin only)
========================================================= */
router.patch("/block/:id", adminMiddleware, async (req, res) => {
  try {
    const admin = req.user;
    const { reason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = !user.isBlocked;

    if (user.isBlocked) {
      if (!reason) {
        return res.status(400).json({ message: "Block reason is required" });
      }
      await AdminLog.create({
        admin: admin._id,
        targetUser: user._id,
        action: user.isBlocked ? "block_user" : "unblock_user",
        details: user.blockReason || "No reason provided",
      });
      user.blockReason = reason;
      user.blockedBy = admin._id;
      user.blockTimestamp = new Date();
      user.sessionVersion += 1; // 🚫 Force logout globally
    } else {
      user.blockReason = null;
      user.blockedBy = null;
      user.blockTimestamp = null;
    }

    await user.save();

    res.json({
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully.`,
      isBlocked: user.isBlocked,
      blockReason: user.blockReason,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/logs", adminMiddleware, async (req, res) => {
  try {
    const logs = await AdminLog.find()
      .populate("admin", "name email")
      .populate("targetUser", "name email")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admin logs" });
  }
});

/* =========================================================
🙋‍♂️ GET CURRENT USER PROFILE (Auth)
========================================================= */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
});

// 📩 USER: Create profile change request (name/email)
// body: { name?: string, email?: string }
router.post("/profile-change-request", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { name, email } = req.body;

    // Check any pending request already
    const existingPending = await ProfileChangeRequest.findOne({
      user: user._id,
      status: "pending",
    });

    if (existingPending) {
      return res.status(400).json({
        message: "You already have a pending profile change request.",
      });
    }

    const fields = [];

    // Name change
    if (typeof name === "string" && name.trim() && name.trim() !== user.name) {
      fields.push({
        field: "name",
        oldValue: user.name,
        newValue: name.trim(),
      });
    }

    // Email change
    if (
      typeof email === "string" &&
      email.trim() &&
      email.trim().toLowerCase() !== user.email.toLowerCase()
    ) {
      const existingEmail = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: user._id },
      });

      if (existingEmail) {
        return res
          .status(400)
          .json({ message: "This email is already in use by another account." });
      }

      fields.push({
        field: "email",
        oldValue: user.email,
        newValue: email.trim().toLowerCase(),
      });
    }

    if (fields.length === 0) {
      return res.status(400).json({
        message: "No valid changes provided. Name or email must be different.",
      });
    }

    const requestDoc = await ProfileChangeRequest.create({
      user: user._id,
      fields,
    });

    return res.status(201).json({
      message: "Profile change request submitted for review.",
      request: requestDoc,
    });
  } catch (err) {
    console.error("Profile change request failed:", err);
    res.status(500).json({ message: "Failed to submit profile change request." });
  }
});

export default router;
