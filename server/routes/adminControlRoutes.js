import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

/* =========================================================
   1️⃣ FETCH ALL USERS
========================================================= */
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

/* =========================================================
   2️⃣ BLOCK / UNBLOCK USER
========================================================= */
router.put("/users/:id/block", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { isBlocked } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: isBlocked ? "User blocked" : "User unblocked", user });
  } catch (err) {
    console.error("Block/unblock error:", err);
    res.status(500).json({ message: "Server error updating block state" });
  }
});

/* =========================================================
   3️⃣ FORCE LOGOUT ALL USERS
========================================================= */
router.post("/force-logout", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await User.updateMany({ role: "user" }, { $set: { isLoggedOut: true } });
    res.json({ message: "✅ All users have been logged out successfully." });
  } catch (err) {
    console.error("Force logout error:", err);
    res.status(500).json({ message: "Server error while logging out users" });
  }
});

/* =========================================================
   4️⃣ MAINTENANCE MODE
========================================================= */
let maintenanceMode = false;

router.post("/maintenance/:status", authMiddleware, adminMiddleware, (req, res) => {
  maintenanceMode = req.params.status === "on";
  res.json({
    message: maintenanceMode
      ? "⚙️ Maintenance mode enabled"
      : "✅ Maintenance mode disabled",
    maintenanceMode,
  });
});

router.get("/maintenance/status", (req, res) => {
  res.json({ maintenanceMode });
});

/* =========================================================
   5️⃣ UPDATE USER ROLE
========================================================= */
router.put("/role/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: `✅ User role updated to ${role}`, user });
  } catch (err) {
    console.error("Role update error:", err);
    res.status(500).json({ message: "Server error updating role" });
  }
});

export default router;
