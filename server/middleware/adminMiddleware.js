// server/middleware/adminMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function adminMiddleware(req, res, next) {
  try {
    // If auth middleware ran, req.user is present — prefer that
    if (!req.user) {
      console.log("Admin check: req.user missing — attempting token decode fallback");

      const token = req.authToken || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
      if (!token) {
        console.log("Admin check failed: no token provided");
        return res.status(401).json({ message: "Unauthorized" });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        console.log("Admin token verify failed:", err.message);
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        console.log("Admin check failed: user not found for token id:", decoded.id);
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.user = user;
    }

    console.log("🧭 Admin check → user:", req.user.email, "| role:", req.user.role);

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next();
  } catch (err) {
    console.error("Admin Middleware Error:", err);
    res.status(500).json({ message: "Server error validating admin privileges" });
  }
}
