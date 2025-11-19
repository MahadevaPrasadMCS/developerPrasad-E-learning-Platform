import express from "express";
import Resource from "../models/Resource.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

// 📥 Get all resources (public)
router.get("/", async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🛒 Redeem resource using coins
router.post("/redeem/:id", authMiddleware, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!resource) return res.status(404).json({ message: "Resource not found" });
    if (user.coins < resource.cost)
      return res.status(400).json({ message: "Not enough coins" });

    user.coins -= resource.cost;
    await user.save();

    res.json({
      message: `You redeemed "${resource.title}" successfully.`,
      downloadUrl: resource.fileUrl,
      newCoinBalance: user.coins,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔐 Add new resource (admin only)
router.post("/", adminMiddleware, async (req, res) => {
  try {
    const { title, description, fileUrl, cost } = req.body;
    const resource = new Resource({ title, description, fileUrl, cost });
    await resource.save();
    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
