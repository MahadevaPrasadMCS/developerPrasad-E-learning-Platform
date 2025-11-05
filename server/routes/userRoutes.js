import express from "express";
import User from "../models/User.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/coins/:id", adminMiddleware, async (req, res) => {
  try {
    const { change } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.coins = Math.max(0, user.coins + change);
    await user.save();

    res.json({ message: `User ${change > 0 ? "rewarded" : "deducted"} successfully.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/block/:id", adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
