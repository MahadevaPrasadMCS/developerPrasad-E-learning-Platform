import express from "express";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
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
   2️⃣ UPDATE USER COINS (+/-)
========================================================= */
router.put("/users/:id/coins", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== "number")
      return res.status(400).json({ message: "Amount must be a number." });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.role === "admin")
      return res.status(403).json({ message: "Cannot modify admin coins." });

    // Adjust coins safely
    user.coins = Math.max(0, (user.coins || 0) + amount);
    await user.save();

    // Sync with Wallet
    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) wallet = new Wallet({ user: user._id, transactions: [] });

    wallet.transactions.push({
      type: amount >= 0 ? "earn" : "spend",
      amount: Math.abs(amount),
      description:
        amount >= 0
          ? `Admin rewarded ${amount} coins`
          : `Admin deducted ${Math.abs(amount)} coins`,
    });
    await wallet.save();

    res.json({
      message:
        amount >= 0
          ? "✅ Coins added successfully."
          : "⚠️ Coins deducted successfully.",
      newBalance: user.coins,
    });
  } catch (err) {
    console.error("Coin update error:", err);
    res.status(500).json({ message: "Failed to update user coins." });
  }
});

/* =========================================================
   3️⃣ BLOCK / UNBLOCK USER
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
   4️⃣ FORCE LOGOUT ALL USERS
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
   5️⃣ MAINTENANCE MODE (Toggle)
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
   6️⃣ UPDATE USER ROLE
========================================================= */
router.put("/role/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role))
      return res.status(400).json({ message: "Invalid role." });

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({ message: `✅ User role updated to ${role}`, user });
  } catch (err) {
    console.error("Role update error:", err);
    res.status(500).json({ message: "Failed to update user role." });
  }
});

export default router;
