// server/routes/ceoUserRoutes.js
import express from "express";
import { requireRoles } from "../middleware/rbacMiddleware.js";
import { ROLES } from "../config/roles.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * GET /api/ceo/users
 * Query params:
 *  - search: name/email substring
 *  - role: filter by role (ceo/admin/instructor/moderator/student or "all")
 *  - page, limit: pagination
 */
router.get("/", requireRoles(ROLES.CEO), async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email role isBlocked createdAt")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.json({
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
    res.status(500).json({ message: "Server error fetching users" });
  }
});

/**
 * GET /api/ceo/users
 * Query: role (optional), search (optional)
 */
router.get("/", ceoOnly, async (req, res) => {
  try {
    const { role, search } = req.query;

    const filter = {};

    if (role && Object.values(ROLES).includes(role)) {
      filter.role = role;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("name email role coins createdAt isBlocked")
      .sort({ createdAt: -1 });

    return res.json({ users });
  } catch (err) {
    console.error("CEO users fetch error:", err);
    return res.status(500).json({ message: "Server error fetching users" });
  }
});

export default router;
