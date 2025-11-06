import express from "express";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import User from "../models/User.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* ==================== ADMIN: Create Quiz ==================== */
router.post("/create", adminMiddleware, async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    if (!title || !questions?.length)
      return res.status(400).json({ message: "Title and questions are required" });

    const quiz = await Quiz.create({
      title,
      description,
      questions,
      status: "draft",
      createdBy: req.user._id,
    });

    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: "Server error creating quiz" });
  }
});

/* ==================== ADMIN: Get All Quizzes ==================== */
router.get("/list", adminMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    console.error("Fetch quizzes error:", err);
    res.status(500).json({ message: "Server error fetching quizzes" });
  }
});

/* ==================== ADMIN: Publish Quiz ==================== */
router.put("/publish/:id", adminMiddleware, async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    quiz.status = "published";
    quiz.startTime = startTime ? new Date(startTime) : new Date();
    quiz.endTime = endTime
      ? new Date(endTime)
      : new Date(Date.now() + 60 * 60 * 1000);

    await quiz.save();
    res.json({ message: "Quiz published", quiz });
  } catch {
    res.status(500).json({ message: "Error publishing quiz" });
  }
});

/* ==================== ADMIN: Unpublish ==================== */
router.put("/unpublish/:id", adminMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    quiz.status = "draft";
    quiz.startTime = null;
    quiz.endTime = null;
    await quiz.save();
    res.json({ message: "Quiz unpublished" });
  } catch {
    res.status(500).json({ message: "Error unpublishing quiz" });
  }
});

/* ==================== USER: Get Active Quiz ==================== */
router.get("/active", async (req, res) => {
  try {
    const now = new Date();
    const active = await Quiz.findOne({
      status: "published",
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).sort({ createdAt: -1 });
    if (!active) return res.status(404).json({ message: "No active quiz" });
    res.json(active);
  } catch {
    res.status(500).json({ message: "Error fetching active quiz" });
  }
});

/* ==================== USER: Submit Quiz ==================== */
router.post("/submit/:id", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const already = await QuizAttempt.findOne({
      quiz: quiz._id,
      user: req.user._id,
    });
    if (already) return res.status(400).json({ message: "Already attempted" });

    const { answers } = req.body;
    let score = 0;
    let earnedCoins = 0;

    quiz.questions.forEach((q, i) => {
      const idx = answers[i];
      if (typeof idx === "number" && q.options[idx] === q.correctAnswer) {
        score++;
        earnedCoins += Number(q.coins || 0);
      }
    });

    await QuizAttempt.create({
      quiz: quiz._id,
      user: req.user._id,
      answers,
      score,
      earnedCoins,
    });

    const user = await User.findById(req.user._id);
    user.coins = (user.coins || 0) + earnedCoins;
    await user.save();

    res.json({
      score,
      totalQuestions: quiz.questions.length,
      earnedCoins,
      newBalance: user.coins,
    });
  } catch {
    res.status(500).json({ message: "Error submitting quiz" });
  }
});

export default router;
