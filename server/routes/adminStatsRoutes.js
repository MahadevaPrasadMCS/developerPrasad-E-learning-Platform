import express from "express";
import User from "../models/User.js";
import QuizAttempt from "../models/quizAttempt.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

/**
 * Utility: build date match object from query (?from=YYYY-MM-DD&to=YYYY-MM-DD)
 */
const buildDateMatch = (query, field = "createdAt") => {
  const { from, to } = query || {};
  const match = {};

  if (from || to) {
    match[field] = {};
    if (from) match[field].$gte = new Date(from);
    if (to) match[field].$lte = new Date(to);
  }

  return Object.keys(match).length ? match : null;
};

/* =====================================================
   1️⃣ USER GROWTH (Users joined per month)
   Optional query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
===================================================== */
router.get(
  "/users-growth",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const dateMatch = buildDateMatch(req.query, "createdAt");

      const pipeline = [];

      if (dateMatch) {
        pipeline.push({ $match: dateMatch });
      }

      pipeline.push(
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } }
      );

      const stats = await User.aggregate(pipeline);

      const formatted = stats.map((s) => ({
        month: s._id,
        users: s.count,
      }));

      res.json(formatted);
    } catch (err) {
      console.error("User growth error:", err);
      res
        .status(500)
        .json({ message: "Server error fetching user growth stats" });
    }
  }
);

/* =====================================================
   2️⃣ QUIZ PARTICIPATION (Attempts per month)
   Optional query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
===================================================== */
router.get(
  "/quiz-participation",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const dateMatch = buildDateMatch(req.query, "createdAt");

      const pipeline = [];

      if (dateMatch) {
        pipeline.push({ $match: dateMatch });
      }

      pipeline.push(
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            attempts: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } }
      );

      const stats = await QuizAttempt.aggregate(pipeline);

      const formatted = stats.map((s) => ({
        month: s._id,
        attempts: s.attempts,
      }));

      res.json(formatted);
    } catch (err) {
      console.error("Quiz participation error:", err);
      res
        .status(500)
        .json({ message: "Server error fetching participation stats" });
    }
  }
);

/* =====================================================
   3️⃣ COIN DISTRIBUTION (Total & Avg per User)
   - Uses aggregation for stats
   - Separate query for top 10 users
===================================================== */
router.get("/coins", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Aggregate for global stats
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalCoins: { $sum: { $ifNull: ["$coins", 0] } },
          avgCoins: { $avg: { $ifNull: ["$coins", 0] } },
        },
      },
    ]);

    const { totalCoins = 0, avgCoins = 0 } = stats[0] || {};
    const roundedAvg = Number(avgCoins.toFixed(2));

    // Top 10 users by coins
    const topUsersDocs = await User.find({}, "name coins")
      .sort({ coins: -1 })
      .limit(10)
      .lean();

    const topUsers = topUsersDocs.map((u) => ({
      name: u.name,
      coins: u.coins || 0,
    }));

    res.json({ totalCoins, avgCoins: roundedAvg, topUsers });
  } catch (err) {
    console.error("Coin stats error:", err);
    res.status(500).json({ message: "Server error fetching coin stats" });
  }
});

/* =====================================================
   4️⃣ MOST ACTIVE USERS (By Attempts)
   Optional:
   - ?from=YYYY-MM-DD&to=YYYY-MM-DD (filter attempts by date)
   - ?limit=number (default 10)
===================================================== */
router.get(
  "/active-users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
      const dateMatch = buildDateMatch(req.query, "createdAt");

      const pipeline = [];

      if (dateMatch) {
        pipeline.push({ $match: dateMatch });
      }

      pipeline.push(
        {
          $group: {
            _id: "$user",
            attempts: { $sum: 1 },
          },
        },
        { $sort: { attempts: -1 } },
        { $limit: limit },
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
        }
      );

      const stats = await QuizAttempt.aggregate(pipeline);

      res.json(stats);
    } catch (err) {
      console.error("Active users error:", err);
      res.status(500).json({ message: "Server error fetching active users" });
    }
  }
);

export default router;
