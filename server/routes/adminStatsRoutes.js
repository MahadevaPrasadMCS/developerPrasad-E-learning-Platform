import express from "express";
import User from "../models/User.js";
import QuizAttempt from "../models/quizAttempt.js";
import Quiz from "../models/Quiz.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

/* =====================================================
   1️⃣ USER GROWTH (Users joined per month)
===================================================== */
router.get("/users-growth", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formatted = stats.map((s) => ({
      month: s._id,
      users: s.count,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("User growth error:", err);
    res.status(500).json({ message: "Server error fetching user growth stats" });
  }
});

/* =====================================================
   2️⃣ QUIZ PARTICIPATION (Attempts per month)
===================================================== */
router.get("/quiz-participation", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await QuizAttempt.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          attempts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formatted = stats.map((s) => ({
      month: s._id,
      attempts: s.attempts,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Quiz participation error:", err);
    res.status(500).json({ message: "Server error fetching participation stats" });
  }
});

/* =====================================================
   3️⃣ COIN DISTRIBUTION (Total & Avg per User)
===================================================== */
router.get("/coins", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, "name coins").sort({ coins: -1 });

    const totalCoins = users.reduce((sum, u) => sum + (u.coins || 0), 0);
    const avgCoins = (totalCoins / users.length || 0).toFixed(2);

    const topUsers = users.slice(0, 10).map((u) => ({
      name: u.name,
      coins: u.coins,
    }));

    res.json({ totalCoins, avgCoins, topUsers });
  } catch (err) {
    console.error("Coin stats error:", err);
    res.status(500).json({ message: "Server error fetching coin stats" });
  }
});

/* =====================================================
   4️⃣ MOST ACTIVE USERS (By Attempts)
===================================================== */
router.get("/active-users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await QuizAttempt.aggregate([
      {
        $group: {
          _id: "$user",
          attempts: { $sum: 1 },
        },
      },
      { $sort: { attempts: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          email: "$user.email",
          attempts: 1,
          coins: "$user.coins",
        },
      },
    ]);

    res.json(stats);
  } catch (err) {
    console.error("Active users error:", err);
    res.status(500).json({ message: "Server error fetching active users" });
  }
});

export default router;
