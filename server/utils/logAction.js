// server/utils/logAction.js
import Log from "../models/Log.js";

/**
 * logAction({
 *   action: "PROMOTION_REQUEST",
 *   category: "PROMOTION",
 *   actor: userId,
 *   target: targetUserId,
 *   description: "User requested promotion to instructor",
 *   details: { requestedRole: "instructor" },
 *   ip: req.ip,
 *   userAgent: req.headers["user-agent"],
 * })
 */
export async function logAction({
  action,
  category = "SYSTEM",
  actor,
  target = null,
  description = "",
  details = {},
  ip,
  userAgent,
}) {
  try {
    if (!action || !actor) return;

    await Log.create({
      action,
      category,
      actor,
      target,
      description,
      details,
      ip,
      userAgent,
    });
  } catch (err) {
    // don’t crash main flow because logging failed
    console.error("Log creation failed:", err.message);
  }
}
