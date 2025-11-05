import express from "express";
import Announcement from "../models/Announcement.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", adminMiddleware, async (req, res) => {
  try {
    const { title, message, weekNumber, winners } = req.body;
    const announcement = new Announcement({ title, message, weekNumber, winners });
    await announcement.save();
    res.status(201).json({ message: "Announcement posted successfully", announcement });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
