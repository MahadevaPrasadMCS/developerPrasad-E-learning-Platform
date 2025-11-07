import express from "express";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
👤 GET ALL USERS (Admin only)
========================================================= */
router.get("/", adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
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
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

export default router;
