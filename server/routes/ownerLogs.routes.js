import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/rbacMiddleware.js";
import { ROLES } from "../config/roles.js";
import ActivityLog from "../models/ActivityLog.js";

const router = express.Router();

// GET /api/owner/logs?limit=50
router.get(
  "/",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN),
  async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 50;

      const logs = await ActivityLog.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      res.json(logs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  }
);

export default router;
