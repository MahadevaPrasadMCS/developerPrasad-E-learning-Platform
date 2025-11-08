import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

/* =========================================================
   1️⃣ FETCH ALL ADMINS ONLY
========================================================= */
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }, "-password").sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({ message: "Failed to fetch admin users." });
  }
});

/* =========================================================
   2️⃣ DELETE ADMIN ACCOUNT
========================================================= */
router.delete("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Admin not found." });
    if (user.role !== "admin")
      return res.status(403).json({ message: "Cannot delete non-admin users here." });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: `Admin ${user.name} deleted successfully.` });
  } catch (err) {
    console.error("Error deleting admin:", err);
    res.status(500).json({ message: "Failed to delete admin." });
  }
});

/* =========================================================
   3️⃣ MAINTENANCE MODE (Toggle)
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

export default router;
