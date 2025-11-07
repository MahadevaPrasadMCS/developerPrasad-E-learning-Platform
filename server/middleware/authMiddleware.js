// server/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Global maintenance flag (optional, shared across routes)
let maintenanceMode = false;
export const setMaintenanceMode = (value) => (maintenanceMode = value);

export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ No token in request for", req.originalUrl);
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    req.authToken = token;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log("❌ Token verify failed:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.log("❌ User not found for token id:", decoded.id);
      return res.status(404).json({ message: "User not found" });
    }

    // 🚫 If user is blocked
    if (user.isBlocked) {
      console.log("🚫 Blocked user tried to access:", user.email);
      return res
        .status(403)
        .json({ message: "Your account has been blocked by admin." });
    }

    // 🚪 If user has been forcibly logged out
    if (user.isLoggedOut) {
      console.log("🚪 Forced logout triggered for:", user.email);
      return res
        .status(403)
        .json({ message: "Session expired. Please log in again." });
    }

    // 🧱 Optional: If site is under maintenance, restrict access (except admin)
    if (maintenanceMode && user.role !== "admin") {
      return res
        .status(503)
        .json({ message: "Site is under maintenance. Please try again later." });
    }

    req.user = user;
    console.log("✅ Authenticated:", user.email, "| role:", user.role);
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ message: "Server error authenticating token" });
  }
}
