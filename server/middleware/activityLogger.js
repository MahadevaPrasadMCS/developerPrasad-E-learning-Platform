import ActivityLog from "../models/ActivityLog.js";

export const logAction = (actionName, getDescription, getMeta = () => ({})) => {
  return async (req, res, next) => {
    // We'll log AFTER response is sent, using 'finish' event
    const start = Date.now();

    res.on("finish", async () => {
      try {
        // Only log if authenticated and not a failed auth
        if (!req.user) return;

        const description =
          typeof getDescription === "function"
            ? getDescription(req)
            : actionName;

        const meta = typeof getMeta === "function" ? getMeta(req, res) : {};

        await ActivityLog.create({
          actor: req.user.id,
          actorName: req.user.name,
          actorRole: req.user.role,
          action: actionName,
          route: req.originalUrl,
          method: req.method,
          targetUser: req.targetUserId || null, // can set this in controller
          description,
          meta: {
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
            ...meta,
          },
        });
      } catch (err) {
        console.error("Failed to write activity log:", err);
      }
    });

    next();
  };
};
