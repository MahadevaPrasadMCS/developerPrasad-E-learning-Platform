import express from "express";
import Reward from "../models/Reward.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Filters for search & period
const buildFilters = (req) => {
  const { search, period } = req.query;
  const filter = {};

  if (period === "today") {
    filter.createdAt = { $gte: new Date().setHours(0, 0, 0, 0) };
  } else if (period === "week") {
    filter.createdAt = {
      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };
  } else if (period === "month") {
    filter.createdAt = {
      $gte: new Date(new Date().setDate(1)),
    };
  }

  if (search) {
    filter.reason = { $regex: search, $options: "i" };
  }

  return filter;
};

// Get rewards list
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const filter = buildFilters(req);

    const rewards = await Reward.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(rewards);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Summary stats
router.get("/summary", authMiddleware, adminMiddleware, async (_, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: "Error fetching summary" });
  }
});

// Add reward
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, coins, reason, adminName } = req.body;

    if (!userId || !coins)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    user.coins = Math.max(0, user.coins + coins);
    await user.save();

  await Reward.create({
    user: userId,
    coins,
    reason,
    admin: adminName,
  });

  // Push into wallet directly (just like spend does)
  await Wallet.findOneAndUpdate(
    { user: userId },
    {
      $push: {
        transactions: {
          type: coins > 0 ? "earn" : "spend",
          amount: Math.abs(coins),
          source: "reward", // new field to label origin
          description: reason,
        },
      },
    },
    { upsert: true }
  );

    res.status(201).json({ message: "Reward updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
