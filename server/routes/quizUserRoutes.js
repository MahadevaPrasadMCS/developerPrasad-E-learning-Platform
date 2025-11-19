import express from "express";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

/* =========================================================
📌 QUIZ LIST + USER STATUS
========================================================= */
router.get("/status/me", authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ status: "published" });
    const attempts = await QuizAttempt.find({ userId: req.user._id });

    const data = quizzes.map((quiz) => {
      const attempt = attempts.find(
        (x) => String(x.quizId) === String(quiz._id)
      );

      return attempt
        ? {
            ...quiz.toObject(),
            attempted: true,
            score: attempt.score,
            totalQuestions: quiz.questions.length,
            status: attempt.status,
          }
        : {
            ...quiz.toObject(),
            attempted: false,
            totalQuestions: quiz.questions.length,
          };
    });

    res.json(data);
  } catch (err) {
    console.error("Status fetch error:", err);
    res.status(500).json({ message: "Failed to load quiz data" });
  }
});

/* =========================================================
📌 ATTEND QUIZ (safe)
========================================================= */
router.get("/attend/:id", authMiddleware, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz || quiz.status !== "published")
    return res.status(403).json({ message: "Quiz not active" });

  const existingAttempt = await QuizAttempt.findOne({
    quizId: quiz._id,
    userId: req.user._id,
  });

  if (existingAttempt?.status === "completed")
    return res.status(400).json({ message: "Already completed" });

  if (existingAttempt?.status === "invalidated")
    return res.status(403).json({ message: "Attempt invalidated" });

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

/* =========================================================
📌 REGISTER START ATTEMPT
========================================================= */
router.post("/register/:id", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const existing = await QuizAttempt.findOne({
      quizId: quiz._id,
      userId: req.user._id,
    });

    if (existing?.status === "completed")
      return res.status(400).json({ message: "Already completed" });

    if (existing?.status === "started")
      return res.json({ message: "Already registered" });

    await QuizAttempt.create({
      quizId: quiz._id,
      userId: req.user._id,
      userName: req.user.name,
      status: "started",
      violations: 0,
    });

    res.json({ message: "Registered" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* =========================================================
📌 SECURITY INVALIDATE
========================================================= */
router.post("/invalidate/:id", authMiddleware, async (req, res) => {
  try {
    const { reason, violations } = req.body;

    await QuizAttempt.findOneAndUpdate(
      {
        quizId: req.params.id,
        userId: req.user._id,
      },
      {
        status: "invalidated",
        violations,
        reason,
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Attempt invalidated" });
  } catch (err) {
    console.error("Invalidate error:", err);
    res.status(500).json({ message: "Failed to invalidate" });
  }
});

/* =========================================================
📌 SUBMIT QUIZ (SCORING + WALLET)
========================================================= */
router.post("/submit/:id", authMiddleware, async (req, res) => {
  try {
    const { answers, violations } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const attempt = await QuizAttempt.findOne({
      quizId: quiz._id,
      userId: req.user._id,
    });

    if (!attempt || attempt.status !== "started")
      return res.status(400).json({ message: "Not registered or already submitted" });

    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: "Invalid submission" });
    }

    // Score Calculation
    let score = 0;
    let earned = 0;

    quiz.questions.forEach((q, i) => {
      if (q.correctAnswer === q.options[answers[i]]) {
        score++;
        earned += q.coins || 10;
      }
    });

    attempt.answers = answers;
    attempt.score = score;
    attempt.violations = violations;
    attempt.earnedCoins = earned;
    attempt.status = "completed";
    await attempt.save();

    // Update user coins
    const user = await User.findById(req.user._id);
    user.coins += earned;
    await user.save();

    // Wallet entry
    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) wallet = new Wallet({ user: user._id });

    wallet.transactions.push({
      type: "earn",
      amount: earned,
      description: `Earned from quiz: ${quiz.title}`,
    });
    await wallet.save();

    res.json({
      score,
      totalQuestions: quiz.questions.length,
      earnedCoins: earned,
      newBalance: user.coins,
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ message: "Submission failed" });
  }
});

/* =========================================================
📌 VIEW RESULT
========================================================= */
router.get("/result/:id", authMiddleware, async (req, res) => {
  const attempt = await QuizAttempt.findOne({
    quizId: req.params.id,
    userId: req.user._id,
    status: "completed",
  });

  if (!attempt)
    return res.status(404).json({ message: "No result found" });

  res.json({
    score: attempt.score,
    totalQuestions: attempt.answers.length,
    earnedCoins: attempt.earnedCoins,
    violations: attempt.violations,
    answers: attempt.answers,
  });
});

export default router;
