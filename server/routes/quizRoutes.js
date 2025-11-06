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

/* ==================== ADMIN: Delete Quiz ==================== */
router.delete("/:id", adminMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error("Delete quiz error:", err);
    res.status(500).json({ message: "Server error deleting quiz" });
  }
});


/* ==================== USER: Get Active Quiz ==================== */
/* ==================== USER: Get Active Quiz ==================== */
router.get("/active", async (req, res) => {
  try {
    const now = new Date();

    // Case 1: A scheduled quiz that is currently within time range
    const activeQuiz = await Quiz.findOne({
      status: "published",
      startTime: { $lte: now },
      $or: [
        { endTime: { $exists: false } },
        { endTime: null },
        { endTime: { $gte: now } }
      ]
    }).sort({ createdAt: -1 });

    if (!activeQuiz)
      return res.status(404).json({ message: "No active quiz right now" });

    res.json(activeQuiz);
  } catch (err) {
    console.error("Active quiz error:", err);
    res.status(500).json({ message: "Server error fetching active quiz" });
  }
});

/* ==================== USER: Get My Quiz Attempts ==================== */
router.get("/attempts/me", authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .populate("quiz", "title status")
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (err) {
    console.error("Fetch attempts error:", err);
    res.status(500).json({ message: "Server error fetching attempts" });
  }
});

/* ==================== USER: Register for Quiz ==================== */
router.post("/register/:id", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (quiz.status !== "published")
      return res.status(400).json({ message: "Quiz is not published" });

    const now = new Date();
    // If quiz is scheduled
    if (quiz.startTime && now < quiz.startTime)
      return res.status(400).json({ message: "Quiz has not started yet" });
    if (quiz.endTime && now > quiz.endTime)
      return res.status(400).json({ message: "Quiz registration closed" });

    // Prevent duplicate registration
    if (quiz.participants.includes(req.user._id))
      return res.status(400).json({ message: "Already registered" });

    quiz.participants.push(req.user._id);
    await quiz.save();

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error("Register quiz error:", err);
    res.status(500).json({ message: "Server error during registration" });
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
