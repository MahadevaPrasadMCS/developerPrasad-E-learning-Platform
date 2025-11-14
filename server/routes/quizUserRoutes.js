import express from "express";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import Wallet from "../models/Wallet.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔍 List available quizzes
router.get("/status/me", authMiddleware, async (req, res) => {
  const quizzes = await Quiz.find({ status: "published" });
  const attempts = await QuizAttempt.find({ userId: req.user._id });

  const data = quizzes.map((quiz) => {
    const a = attempts.find((x) => String(x.quizId) === String(quiz._id));
    return a
      ? { ...quiz.toObject(), attempted: true, score: a.score, status: a.status }
      : { ...quiz.toObject(), attempted: false };
  });

  res.json(data);
});

// 🧩 Attend Quiz (sanitized)
router.get("/attend/:id", authMiddleware, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz || quiz.status !== "published")
    return res.status(403).json({ message: "Quiz not active" });

  const existing = await QuizAttempt.findOne({
    quizId: quiz._id,
    userId: req.user._id,
  });

  if (existing?.status === "invalidated")
    return res.status(403).json({ message: "Attempt invalidated. Contact admin" });

  res.json({
    _id: quiz._id,
    title: quiz.title,
    description: quiz.description,
    questions: quiz.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      coins: q.coins,
    })),
  });
});

// 📝 Register to attempt quiz
router.post("/register/:id", authMiddleware, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  const existing = await QuizAttempt.findOne({
    quizId: quiz._id,
    userId: req.user._id,
  });

  if (existing)
    return res.status(400).json({ message: "Already attempted" });

  res.json({ message: "Registered" });
});

// ☠ Security Invalidate
router.post("/invalidate/:id", authMiddleware, async (req, res) => {
  const { reason, violations } = req.body;

  const attempt = new QuizAttempt({
    quizId: req.params.id,
    userId: req.user._id,
    userName: req.user.name,
    status: "invalidated",
    violations,
    reason,
    answers: [],
    score: 0,
  });

  await attempt.save();
  res.json({ message: "Attempt invalidated" });
});

// 🎯 Submit
router.post("/submit/:id", authMiddleware, async (req, res) => {
  const { answers, violations } = req.body;

  const quiz = await Quiz.findById(req.params.id);

  let score = 0, earned = 0;
  quiz.questions.forEach((q, i) => {
    if (q.correctAnswer === q.options[answers[i]]) {
      score++;
      earned += q.coins || 10;
    }
  });

  const attempt = new QuizAttempt({
    quizId: quiz._id,
    userId: req.user._id,
    userName: req.user.name,
    answers,
    score,
    earnedCoins: earned,
    violations,
  });

  await attempt.save();
  res.json({ score, totalQuestions: quiz.questions.length, earnedCoins: earned });
});

export default router;
