// server/routes/ceoUserRoutes.js
import express from "express";
import { requireRoles } from "../middleware/rbacMiddleware.js";
import { ROLES } from "../config/roles.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * GET /api/ceo/users
 * CEO — List Users with Filters + Pagination
 * Query Params:
 *  - search: name/email match
 *  - role: filter by role
 *  - page: pagination (default: 1)
 *  - limit: number of users per page (default: 10)
 */
router.get("/", requireRoles(ROLES.CEO), async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (search?.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email role coins isBlocked createdAt")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),

      User.countDocuments(filter),
    ]);

    return res.json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("CEO users fetch error:", err);
    return res.status(500).json({ message: "Server error fetching users" });
  }
});

export default router;
