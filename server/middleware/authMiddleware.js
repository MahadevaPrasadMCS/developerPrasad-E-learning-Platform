// server/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let maintenanceMode = false;
export const setMaintenanceMode = (value) => (maintenanceMode = value);

export default async function authMiddleware(req, res, next) {
  try {
    // Public Auth Routes: allow login + register without token
    if (
      req.originalUrl.includes("/auth/login") ||
      req.originalUrl.includes("/auth/register")
    ) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      console.error("❗ JWT_SECRET missing in environment variables");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

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

    // 🚫 Block checks
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Account blocked by admin.",
        reason: user.blockReason,
        blockedAt: user.blockTimestamp,
      });
    }

    // 🔐 Session invalidated by admin
    if (decoded.sessionVersion !== user.sessionVersion) {
      return res.status(403).json({
        message: "Session revoked. Please log in again.",
      });
    }

    // 🚪 Forced logout flag
    if (user.isLoggedOut) {
      return res.status(403).json({ message: "Session expired. Please log in again." });
    }

    // 🔧 Maintenance mode — allow admin only
    if (maintenanceMode && user.role !== "admin") {
      return res.status(503).json({ message: "Maintenance ongoing. Try later." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
}
