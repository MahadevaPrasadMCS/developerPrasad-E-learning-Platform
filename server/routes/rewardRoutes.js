import express from "express";
import Reward from "../models/Reward.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// 📊 Get all rewards
router.get("/", adminMiddleware, async (req, res) => {
  const rewards = await Reward.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json(rewards);
});

// 📈 Summary data for charts
router.get("/summary", adminMiddleware, async (req, res) => {
  const totalRewards = await Reward.aggregate([
    { $match: { coins: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: "$coins" } } },
  ]);

  const totalDeductions = await Reward.aggregate([
    { $match: { coins: { $lt: 0 } } },
    { $group: { _id: null, total: { $sum: "$coins" } } },
  ]);

  const totalUsers = await Reward.distinct("user");

  res.json({
    totalRewards: totalRewards[0]?.total || 0,
    totalDeductions: Math.abs(totalDeductions[0]?.total || 0),
    totalUsers: totalUsers.length,
  });
});

// ➕ Add reward entry & update user's coins
router.post("/", adminMiddleware, async (req, res) => {
  try {
    const { userId, coins, reason, adminName } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.coins = Math.max(0, user.coins + coins);
    await user.save();

    const reward = new Reward({
      user: userId,
      coins,
      reason,
      admin: adminName,
    });
    await reward.save();

    res.status(201).json({ message: "Reward logged successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
