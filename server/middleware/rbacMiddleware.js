// server/middleware/rbacMiddleware.js
import { ROLES } from "../config/roles.js";

export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    next();
  };
};

export const requirePermissions = (...requiredPerms) => {
  return (req, res, next) => {
    if (!req.user?.permissions) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const hasAny = requiredPerms.some(
      (perm) => req.user.permissions[perm]
    );

    if (!hasAny) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
};

export const requireRoleOrPermission = (roles = [], perms = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const roleOk = roles.length === 0 || roles.includes(req.user.role);
    const permOk =
      perms.length === 0 ||
      perms.some((p) => req.user.permissions && req.user.permissions[p]);

    if (!roleOk && !permOk) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient access" });
    }

    next();
  };
};