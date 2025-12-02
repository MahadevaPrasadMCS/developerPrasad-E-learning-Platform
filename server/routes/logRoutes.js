// routes/logRoutes.js
import express from "express";
import Log from "../models/SystemLog.js";
import { ROLES } from "../config/roles.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// CEO Important Actions Only
const CEO_VISIBLE_ACTIONS = [
  "ROLE_UPDATE",
  "PROMOTION_REQUEST",
  "PROMOTION_APPROVED",
  "PROMOTION_REJECTED",
  "WALLET_ACTION",
  "QUIZ_ACTION",
  "RESOURCE_UPLOAD",
  "SECURITY_ALERT",
];

router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const isCEO = user.role === ROLES.CEO;

    // 🔍 Base role-based filter
    const filter = {};

    if (isCEO) {
      // CEO sees only impactful security/operational logs
      filter.action = { $in: CEO_VISIBLE_ACTIONS };
    } else if (user.role === ROLES.ADMIN) {
      // admin sees everything
    } else if (
      user.role === ROLES.MODERATOR ||
      user.role === ROLES.INSTRUCTOR
    ) {
      // only logs related to them
      filter.$or = [{ actor: user._id }, { target: user._id }];
    } else {
      // student or restricted role
      return res.status(403).json({ message: "Access restricted" });
    }

    const {
      search,
      action,
      actor,
      target,
      ip,
      from,
      to,
      page = 1,
      limit = 10,
      sort = "desc",
    } = req.query;

    if (action) filter.action = action;
    if (actor) filter.actor = actor;
    if (target) filter.target = target;
    if (ip) filter.ip = ip;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    if (search && search.trim()) {
      filter.details = { $regex: search.trim(), $options: "i" };
    }

    const sortOrder = sort === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      Log.find(filter)
        .populate("actor", "name email role")
        .populate("target", "name email role")
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Log.countDocuments(filter),
    ]);

    res.json({
      logs,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Fetch logs error:", err);
    res.status(500).json({ message: "Server error fetching logs" });
  }
});

export default router;
