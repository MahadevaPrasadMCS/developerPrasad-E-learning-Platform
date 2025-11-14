import express from "express";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// 🛠 Create Quiz (Admin)
router.post("/create", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    if (!title || !Array.isArray(questions) || !questions.length)
      return res.status(400).json({ message: "Title and questions required" });

    const quiz = new Quiz({
      title,
      description,
      questions,
      status: "draft",
      createdBy: req.user._id,
    });

    await quiz.save();
    res.status(201).json({ message: "Quiz created", quiz });
  } catch (err) {
    console.error("Create quiz error:", err);
    res.status(500).json({ message: "Failed to create quiz" });
  }
});

// ✏️ Update quiz
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!quiz) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Quiz updated", quiz });
  } catch (err) {
    res.status(500).json({ message: "Error updating quiz" });
  }
});

// 🗑 Delete quiz
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: "Quiz deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// 📣 Publish quiz
router.put("/publish/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { startTime, endTime } = req.body;

  if (!startTime || !endTime)
    return res.status(400).json({ message: "Provide timing" });

  const quiz = await Quiz.findByIdAndUpdate(
    req.params.id,
    { startTime, endTime, status: "published" },
    { new: true }
  );

  res.json({ message: "Quiz published", quiz });
});

// ⛔ Unpublish quiz
router.put("/unpublish/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const quiz = await Quiz.findByIdAndUpdate(
    req.params.id,
    { status: "draft", startTime: null, endTime: null },
    { new: true }
  );

  res.json({ message: "Quiz unpublished", quiz });
});

// 📊 Analytics
router.get("/:id/analytics", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ quizId: req.params.id });
    const totalUsers = attempts.length;
    const avgScore = attempts.reduce((sum, a) => sum + a.score, 0) / (totalUsers || 1);

    res.json({
      totalUsers,
      averageScore: avgScore.toFixed(2),
      attempts,
    });
  } catch {
    res.status(500).json({ message: "Analytics failed" });
  }
});

export default router;
