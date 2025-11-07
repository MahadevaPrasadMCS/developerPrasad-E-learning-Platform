import express from "express";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

/* =========================================================
   🧩 1️⃣ CREATE QUIZ (Admin only)
   POST /api/quiz/create
========================================================= */
router.post("/create", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.status(201).json({ message: "✅ Quiz created successfully", quiz });
  } catch (err) {
    console.error("Quiz creation error:", err);
    res.status(500).json({ message: "Failed to create quiz" });
  }
});

/* =========================================================
   📜 2️⃣ LIST ALL QUIZZES
   GET /api/quiz/list
========================================================= */
router.get("/list", async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    console.error("Quiz list error:", err);
    res.status(500).json({ message: "Failed to load quizzes" });
  }
});

/* =========================================================
   🗑️ 3️⃣ DELETE QUIZ (Admin only)
   DELETE /api/quiz/:id
========================================================= */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await Quiz.findByIdAndDelete(id);
    res.json({ message: "🗑️ Quiz deleted successfully" });
  } catch (err) {
    console.error("Quiz delete error:", err);
    res.status(500).json({ message: "Failed to delete quiz" });
  }
});

/* =========================================================
   🚀 4️⃣ PUBLISH QUIZ (Admin only)
   PUT /api/quiz/publish/:id
========================================================= */
router.put("/publish/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ message: "Start and end times required." });
    }

    const quiz = await Quiz.findByIdAndUpdate(
      id,
      { startTime, endTime, status: "published" },
      { new: true }
    );

    res.json({ message: "✅ Quiz published successfully", quiz });
  } catch (err) {
    console.error("Publish error:", err);
    res.status(500).json({ message: "Failed to publish quiz" });
  }
});

/* =========================================================
   ⏸️ 5️⃣ UNPUBLISH QUIZ
   PUT /api/quiz/unpublish/:id
========================================================= */
router.put("/unpublish/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByIdAndUpdate(
      id,
      { status: "draft", startTime: null, endTime: null },
      { new: true }
    );
    res.json({ message: "⚠️ Quiz unpublished", quiz });
  } catch (err) {
    console.error("Unpublish error:", err);
    res.status(500).json({ message: "Failed to unpublish quiz" });
  }
});

/* =========================================================
   📊 6️⃣ QUIZ ANALYTICS (Admin only)
   GET /api/quiz/:id/analytics
========================================================= */
router.get("/:id/analytics", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid quiz ID" });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const attempts = await QuizAttempt.find({ quizId: id });

    if (attempts.length === 0) {
      return res.json({
        totalAttempts: 0,
        averageScore: 0,
        successRate: 0,
        topPerformers: [],
      });
    }

    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const averageScore = totalScore / totalAttempts;
    const successCount = attempts.filter((a) => a.score >= 50).length; // success = 50%+
    const successRate = (successCount / totalAttempts) * 100;

    const topPerformers = attempts
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((a) => ({
        name: a.userName || "Anonymous",
        score: a.score,
      }));

    res.json({
      totalAttempts,
      averageScore,
      successRate,
      topPerformers,
    });
  } catch (err) {
    console.error("Quiz analytics error:", err);
    res.status(500).json({ message: "Server error fetching quiz analytics" });
  }
});

export default router;
