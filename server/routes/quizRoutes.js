import express from "express";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import User from "../models/User.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Admin create quiz (draft)
 */
router.post("/create", adminMiddleware, async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    if (!title || !Array.isArray(questions) || questions.length === 0)
      return res.status(400).json({ message: "Title and questions are required" });

    const quiz = new Quiz({
      title,
      description: description || "",
      questions,
      status: "draft",
      createdBy: req.user._id,
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    console.error("Create quiz error:", err);
    res.status(500).json({ message: "Server error creating quiz" });
  }
});

/**
 * Admin list all quizzes
 */
router.get("/list", adminMiddleware, async (req, res) => {
  try {
    const all = await Quiz.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching quizzes" });
  }
});

/**
 * Admin publish an existing quiz
 */
router.put("/publish/:id", adminMiddleware, async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (!startTime || !endTime)
      return res.status(400).json({ message: "startTime and endTime required" });

    quiz.startTime = new Date(startTime);
    quiz.endTime = new Date(endTime);
    quiz.status = "published";
    await quiz.save();

    res.json({ message: "Quiz published", quiz });
  } catch (err) {
    console.error("Publish error:", err);
    res.status(500).json({ message: "Server error publishing quiz" });
  }
});

/**
 * Admin unpublish (revert to draft)
 */
router.put("/unpublish/:id", adminMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    quiz.status = "draft";
    quiz.startTime = null;
    quiz.endTime = null;
    await quiz.save();

    res.json({ message: "Quiz unpublished", quiz });
  } catch (err) {
    console.error("Unpublish error:", err);
    res.status(500).json({ message: "Server error unpublishing quiz" });
  }
});

/**
 * Public: get published quizzes
 */
router.get("/published", async (req, res) => {
  try {
    const published = await Quiz.find({ status: "published" }).sort({ createdAt: -1 });
    res.json(published);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching published quizzes" });
  }
});

/**
 * Register for a published quiz
 */
router.post("/register/:id", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (quiz.status !== "published")
      return res.status(400).json({ message: "Quiz is not published" });

    const now = new Date();
    if (quiz.startTime && now >= quiz.startTime)
      return res.status(400).json({ message: "Registration closed" });

    if (quiz.participants.includes(req.user._id))
      return res.status(400).json({ message: "Already registered" });

    quiz.participants.push(req.user._id);
    await quiz.save();

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

/**
 * Get active quiz
 */
router.get("/active", async (req, res) => {
  try {
    const now = new Date();

    const manual = await Quiz.findOne({
      status: "published",
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).sort({ createdAt: -1 });

    if (manual) return res.json(manual);

    const day = now.getDay();
    if (day === 6) {
      const latestPublished = await Quiz.findOne({ status: "published" }).sort({ createdAt: -1 });
      if (latestPublished) return res.json({ ...latestPublished._doc, auto: true });
    }

    res.status(404).json({ message: "No active quiz" });
  } catch (err) {
    console.error("Active quiz error:", err);
    res.status(500).json({ message: "Server error fetching active quiz" });
  }
});

/**
 * Submit answers
 */
router.post("/submit/:id", authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers))
      return res.status(400).json({ message: "Answers array required" });

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const now = new Date();
    const isManual =
      quiz.startTime && quiz.endTime && now >= quiz.startTime && now <= quiz.endTime;
    const isSaturday = now.getDay() === 6;

    if (!isManual && !isSaturday)
      return res.status(400).json({ message: "Quiz not active" });

    if (!quiz.participants.includes(req.user._id))
      return res.status(403).json({ message: "You must register first" });

    const already = await QuizAttempt.findOne({ quiz: quiz._id, user: req.user._id });
    if (already) return res.status(400).json({ message: "Already attempted" });

    let score = 0;
    let earnedCoins = 0;
    quiz.questions.forEach((q, i) => {
      const idx = answers[i];
      if (typeof idx === "number" && q.options[idx] === q.correctAnswer) {
        score += 1;
        earnedCoins += Number(q.coins || 0);
      }
    });

    const attempt = new QuizAttempt({
      quiz: quiz._id,
      user: req.user._id,
      answers,
      score,
      earnedCoins,
    });
    await attempt.save();

    const user = await User.findById(req.user._id);
    user.coins = (user.coins || 0) + earnedCoins;
    await user.save();

    res.json({
      message: "Quiz submitted",
      score,
      totalQuestions: quiz.questions.length,
      earnedCoins,
      newBalance: user.coins,
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ message: "Server error while submitting quiz" });
  }
});

/**
 * Get attempts for user
 */
router.get("/attempts/me", authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id }).populate("quiz", "title");
    res.json(attempts);
  } catch (err) {
    console.error("Attempt history error:", err);
    res.status(500).json({ message: "Server error fetching attempts" });
  }
});

/**
 * Admin: get submissions for quiz
 */
router.get("/attempts/:quizId", adminMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ quiz: req.params.quizId }).populate("user", "name email");
    res.json(attempts);
  } catch (err) {
    console.error("Admin attempts error:", err);
    res.status(500).json({ message: "Server error fetching attempts" });
  }
});

/**
 * Admin: delete quiz
 */
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

export default router;
