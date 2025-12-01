// server/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ROLES } from "../config/roles.js"; // ⬅ ADDED

let maintenanceMode = false;

// You can import and call this from some admin/CEO controller
export const setMaintenanceMode = (value) => {
  maintenanceMode = Boolean(value);
};

// 🔐 CEO-only route guard
export const requireCEO = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.CEO) {
    return res.status(403).json({
      message: "Access denied. CEO only.",
    });
  }
  next();
};

export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❗ JWT_SECRET missing in environment variables");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🚫 Block check
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Account blocked by admin.",
        reason: user.blockReason,
        blockedAt: user.blockTimestamp,
      });
    }

    // 🔐 Session invalidated by admin (bump sessionVersion on admin action)
    if (
      typeof decoded.sessionVersion === "number" &&
      decoded.sessionVersion !== user.sessionVersion
    ) {
      return res.status(403).json({
        message: "Session revoked. Please log in again.",
      });
    }

    // 🚪 Forced logout flag
    if (user.isLoggedOut) {
      return res
        .status(403)
        .json({ message: "Session expired. Please log in again." });
    }

    // 🔧 Maintenance mode — allow only CEO + Admin
    if (maintenanceMode && ![ROLES.CEO, ROLES.ADMIN].includes(user.role)) {
      return res
        .status(503)
        .json({ message: "Maintenance ongoing. Try later." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
}
