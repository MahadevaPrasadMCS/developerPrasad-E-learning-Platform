// server/routes/logRoutes.js
import express from "express";
import Log from "../models/SystemLog.js";
import { ROLES } from "../config/roles.js";
import { requireRoles } from "../middleware/rbacMiddleware.js";

const router = express.Router();

/**
 * GET /api/logs
 * CEO + Admin → all logs (with filters)
 * Instructor / Moderator → only logs where they are actor or target
 * Students → 403
 */
router.get("/", async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isCEO = user.role === ROLES.CEO;
    const isAdmin = user.role === ROLES.ADMIN;
    const isInstructor = user.role === ROLES.INSTRUCTOR;
    const isModerator = user.role === ROLES.MODERATOR;

    // 🧱 base filter depending on role
    const filter = {};

    if (isCEO || isAdmin) {
      // full visibility
    } else if (isInstructor || isModerator) {
      // only logs related to them
      filter.$or = [{ actor: user._id }, { target: user._id }];
    } else {
      // students / others → no direct log access
      return res.status(403).json({ message: "Logs not available for this role" });
    }

    // 🔍 query params
    const {
      action,
      category,
      actorId,
      targetId,
      ip,
      from, // ISO date
      to,   // ISO date
      search,
      page = 1,
      limit = 20,
      sort = "desc", // "asc" or "desc"
      export: exportMode, // "csv" | "json" | undefined
    } = req.query;

    // typed filters
    if (action) filter.action = action;
    if (category) filter.category = category;
    if (actorId) filter.actor = actorId;
    if (targetId) filter.target = targetId;
    if (ip) filter.ip = ip;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    // text search on description (and optionally details)
    if (search && search.trim()) {
      const s = search.trim();
      filter.$text = { $search: s };
      // note: needs text index (already defined on description)
    }

    const sortOrder = sort === "asc" ? 1 : -1;

    // 📤 Export mode (no pagination or limited)
    if (exportMode === "csv" || exportMode === "json") {
      const MAX_EXPORT = 5000;
      const logs = await Log.find(filter)
        .populate("actor", "name email role")
        .populate("target", "name email role")
        .sort({ createdAt: sortOrder })
        .limit(MAX_EXPORT)
        .lean();

      if (exportMode === "json") {
        return res.json({
          export: true,
          count: logs.length,
          logs,
        });
      }

      // CSV export
      const header = [
        "time",
        "action",
        "category",
        "actorName",
        "actorEmail",
        "actorRole",
        "targetName",
        "targetEmail",
        "targetRole",
        "ip",
        "description",
      ];

      const rows = logs.map((log) => [
        log.createdAt?.toISOString() || "",
        log.action || "",
        log.category || "",
        log.actor?.name || "",
        log.actor?.email || "",
        log.actor?.role || "",
        log.target?.name || "",
        log.target?.email || "",
        log.target?.role || "",
        log.ip || "",
        (log.description || "").replace(/\r?\n/g, " "),
      ]);

      const toCsvLine = (arr) =>
        arr
          .map((val) => {
            const v = String(val ?? "");
            if (v.includes(",") || v.includes('"') || v.includes("\n")) {
              return `"${v.replace(/"/g, '""')}"`;
            }
            return v;
          })
          .join(",");

      const csv = [toCsvLine(header), ...rows.map(toCsvLine)].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="logs-${Date.now()}.csv"`
      );
      return res.send(csv);
    }

    // 📄 Normal paginated response
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Log.find(filter)
        .populate("actor", "name email role")
        .populate("target", "name email role")
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Log.countDocuments(filter),
    ]);

    return res.json({
      logs : items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("Fetch logs error:", err);
    return res.status(500).json({ message: "Server error fetching logs" });
  }
});

export default router;
