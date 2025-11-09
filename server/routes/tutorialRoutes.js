import express from "express";
import Tutorial from "../models/Tutorial.js"; // You’ll create this model next (very simple)

const router = express.Router();

/* =========================================================
🎥 PUBLIC TUTORIALS PREVIEW (For Explore Page)
========================================================= */
router.get("/public", async (req, res) => {
  try {
    const tutorials = await Tutorial.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("title description thumbnail");

    // If no tutorials exist, show fallback data
    if (!tutorials.length) {
      return res.json([
        {
          _id: 1,
          title: "Intro to JavaScript",
          description:
            "Understand JS fundamentals with short examples and practical snippets.",
          thumbnail:
            "https://media.geeksforgeeks.org/wp-content/uploads/20240701150350/JavaScript-Tutorial-copy.webp",
        },
        {
          _id: 2,
          title: "React Basics for Beginners",
          description: "Start building interactive UI components using React.",
          thumbnail:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcl0L3S78sIMLZuHL3fz7_Evl1IrI3H3YXcg&s",
        },
      ]);
    }

    res.json(tutorials);
  } catch (err) {
    console.error("Public tutorials fetch error:", err);
    res.status(500).json({ message: "Failed to load tutorials" });
  }
});

export default router;
