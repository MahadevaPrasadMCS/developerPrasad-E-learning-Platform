// server/routes/ceoUserRoutes.js
import express from "express";
import { requireRoles } from "../middleware/rbacMiddleware.js";
import { ROLES } from "../config/roles.js";
import User from "../models/User.js";
import RoleChangeRequest from "../models/RoleChangeRequest.js";

const router = express.Router();

// Active demotion statuses we care about
const ACTIVE_DEMOTION_STATUSES = [
  "PENDING_USER_REVIEW",
  "USER_ACCEPTED",
  "USER_DISPUTED",
];

/**
 * GET /api/ceo/users
 * Query params:
 *  - search: name/email substring
 *  - role: filter by role (ceo/admin/instructor/moderator/student or "all")
 *  - page, limit: pagination
 *
 * Response:
 *  {
 *    users: [
 *      {
 *        _id, name, email, role, isBlocked, createdAt, coins?,
 *        demotion: {
 *          status,
 *          newRole,
 *          userResponse,
 *          reason,
 *          createdAt
 *        } | null
 *      },
 *      ...
 *    ],
 *    pagination: { total, page, limit, pages }
 *  }
 */
router.get("/", requireRoles(ROLES.CEO), async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const [usersRaw, total] = await Promise.all([
      User.find(filter)
        .select("name email role isBlocked createdAt coins")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    const users = usersRaw.map((u) => u.toObject());

    // Attach active demotion status (if any) for these users
    const userIds = users.map((u) => u._id);

    const demotions = await RoleChangeRequest.find({
      user: { $in: userIds },
      status: { $in: ACTIVE_DEMOTION_STATUSES },
    })
      .sort({ createdAt: -1 }) // latest first per user
      .lean();

    const demotionMap = new Map();
    for (const d of demotions) {
      const key = d.user.toString();
      if (!demotionMap.has(key)) {
        demotionMap.set(key, {
          status: d.status,
          newRole: d.newRole,
          userResponse: d.userResponse || null,
          reason: d.reason || "",
          createdAt: d.createdAt,
        });
      }
    }

    const usersWithDemotion = users.map((u) => {
      const d = demotionMap.get(u._id.toString());
      return {
        ...u,
        demotion: d || null,
      };
    });

    return res.json({
      users: usersWithDemotion,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("CEO users fetch error:", err);
    return res
      .status(500)
      .json({ message: "Server error fetching users" });
  }
});

export default router;
