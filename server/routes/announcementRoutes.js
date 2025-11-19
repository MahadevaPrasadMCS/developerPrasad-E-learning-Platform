import express from "express";
import Announcement from "../models/Announcement.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

/* ===========================================
   GET all announcements (Public Route)
   =========================================== */
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error("❌ Error fetching announcements:", error);
    res.status(500).json({ message: "Server error fetching announcements" });
  }
});

/* ===========================================
   POST new announcement (Admin only)
   =========================================== */
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, links, specialThings } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const validLinks = Array.isArray(links)
      ? links.filter((url) => url && /^https?:\/\/.+/.test(url))
      : [];

    const announcement = new Announcement({
      title,
      description,
      links: validLinks,
      specialThings,
    });

    await announcement.save();
    res.status(201).json({
      message: "✅ Announcement posted successfully",
      announcement,
    });
  } catch (error) {
    console.error("❌ Error posting announcement:", error);
    res.status(500).json({ message: "Server error posting announcement" });
  }
});

/* ===========================================
   PATCH (Update) announcement (Admin only)
   =========================================== */
router.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, links, specialThings } = req.body;

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, description, links, specialThings },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "✅ Announcement updated successfully", updated });
  } catch (error) {
    console.error("❌ Edit error:", error);
    res.status(500).json({ message: "Server error updating announcement" });
  }
});

/* ===========================================
   DELETE announcement (Admin only)
   =========================================== */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    res.json({ message: "🗑️ Announcement deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ message: "Server error deleting announcement" });
  }
});

// 📢 PUBLIC ANNOUNCEMENTS (for Explore Page)
router.get("/public", async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title date createdAt");

    res.json(
      announcements.map((a) => ({
        _id: a._id,
        title: a.title,
        date: a.date
          ? new Date(a.date).toLocaleDateString()
          : new Date(a.createdAt).toLocaleDateString(),
      }))
    );
  } catch (err) {
    console.error("Public announcements fetch error:", err);
    res.status(500).json({ message: "Failed to load announcements" });
  }
});


export default router;
