import express from "express";
import Community from "../models/Community.js";
import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// 🟢 Get all posts
router.get("/", async (req, res) => {
  try {
    const threads = await Community.find()
      .populate("user", "name email")
      .populate("replies.user", "name")
      .sort({ createdAt: -1 });
    res.json(threads);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🟡 Create new post
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim())
      return res.status(400).json({ message: "Message cannot be empty" });

    const post = await Community.create({
      user: req.user.id,
      message: message.trim(),
    });

    const populated = await post.populate("user", "name email");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to post" });
  }
});

// 🔵 Add reply
router.post("/:id/reply", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim())
      return res.status(400).json({ message: "Reply cannot be empty" });

    const thread = await Community.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    thread.replies.push({
      user: req.user.id,
      message: message.trim(),
    });

    await thread.save();
    const updated = await thread
      .populate("user", "name")
      .populate("replies.user", "name");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to reply" });
  }
});

export default router;
