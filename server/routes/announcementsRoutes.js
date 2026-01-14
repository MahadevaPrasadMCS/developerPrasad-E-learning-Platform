import express from "express";
import Announcement from "../models/Announcement.js";

const router = express.Router();

// 🌍 PUBLIC — no auth
router.get("/public", async (req, res) => {
  try {
    const data = await Announcement.find({ published: true })
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

export default router;
