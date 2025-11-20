// rbacMiddleware.js
import { ROLES } from "../config/roles.js";

const ROLE_HIERARCHY = {
  [ROLES.CEO]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.INSTRUCTOR]: 2,
  [ROLES.MODERATOR]: 1,
  [ROLES.STUDENT]: 0,
};

export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRank = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredRanks = allowedRoles.map((r) => ROLE_HIERARCHY[r] || 0);

    const hasAccess = requiredRanks.some((rank) => userRank >= rank);

    if (!hasAccess) {
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

    const roleRank = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredRank = Math.max(...roles.map((r) => ROLE_HIERARCHY[r] || 0));

    const roleOk = roles.length === 0 || roleRank >= requiredRank;
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
