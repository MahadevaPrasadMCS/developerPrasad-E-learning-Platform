// server/routes/ceoStatsRoutes.js
import express from "express";
import User from "../models/User.js";
import PromotionRequest from "../models/PromotionRequest.js";
import Quiz from "../models/Quiz.js";
import WalletTransaction from "../models/WalletTransaction.js"; // if exists
import SystemLog from "../models/SystemLog.js";
import { requireRoles } from "../middleware/rbacMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = express.Router();

router.get(
  "/",
  requireRoles(ROLES.CEO),
  async (req, res) => {
    try {
      // 🧑‍🤝‍🧑 User counts by role
      const userCounts = await User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]);

      const userCountFormatted = userCounts.reduce((acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {});

      userCountFormatted.total = await User.countDocuments();

      // 📝 Quiz summary
      const quizCounts = {
        active: await Quiz.countDocuments({ status: "published" }),
        draft: await Quiz.countDocuments({ status: "draft" }),
      };

      // 💰 Wallet stats (fallback if missing collection)
      let walletStats = { transactions: 0, growth: "+0%" };

      try {
        walletStats.transactions = await WalletTransaction.countDocuments();
      } catch {
        console.log("WalletTransaction model not yet added");
      }

      // 📈 New users per month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

      const monthlyUsersRaw = await User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]);

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      const monthlyUsers = monthlyUsersRaw.map((item) => ({
        month: monthNames[item._id.month - 1],
        count: item.count,
      }));

      return res.json({
        userCounts: userCountFormatted,
        quizCounts,
        walletStats,
        monthlyUsers,
      });

    } catch (err) {
      console.error("CEO Stats Error:", err);
      return res.status(500).json({ message: "Failed to load stats" });
    }
  }
);

export default router;