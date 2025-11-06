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

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Title and at least one question are required" });
    }

    // Validate each question
    for (const q of questions) {
      if (!q.question || !q.options?.length || !q.correctAnswer) {
        return res.status(400).json({ message: "Each question must have text, options, and a correct answer" });
      }
      if (!q.options.includes(q.correctAnswer)) {
        return res.status(400).json({
          message: `Correct answer "${q.correctAnswer}" must be one of the provided options for "${q.question}".`,
        });
      }
    }

    const quiz = new Quiz({
      title,
      description: description || "",
      questions,
      status: "draft",
      createdBy: req.user._id,
    });

    await quiz.save();
    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (err) {
    console.error("Create quiz error:", err);
    res.status(500).json({ message: "Server error creating quiz" });
  }
});

/* ==================== ADMIN: Get All Quizzes ==================== */
router.get("/list", adminMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");
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
    quiz.endTime = endTime ? new Date(endTime) : null;

    await quiz.save();
    res.json({ message: "Quiz published successfully", quiz });
  } catch (err) {
    console.error("Publish quiz error:", err);
    res.status(500).json({ message: "Server error publishing quiz" });
  }
});

/* ==================== ADMIN: Unpublish Quiz ==================== */
router.put("/unpublish/:id", adminMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    quiz.status = "draft";
    quiz.startTime = null;
    quiz.endTime = null;
    await quiz.save();

    res.json({ message: "Quiz unpublished successfully" });
  } catch (err) {
    console.error("Unpublish quiz error:", err);
    res.status(500).json({ message: "Server error unpublishing quiz" });
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

/* ==================== USER: Register for Quiz ==================== */
router.post("/register/:id", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (quiz.status !== "published")
      return res.status(400).json({ message: "Quiz is not published" });

    const now = new Date();
    if (quiz.startTime && now < quiz.startTime)
      return res.status(400).json({ message: "Quiz has not started yet" });
    if (quiz.endTime && now > quiz.endTime)
      return res.status(400).json({ message: "Quiz has ended" });

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

/* ==================== USER: Get Active Quiz ==================== */
/* ==================== USER: Get Active Quiz ==================== */
router.get("/active", async (req, res) => {
  try {
    const now = new Date();

    const activeQuiz = await Quiz.findOne({
      status: "published",
      $or: [
        { startTime: { $exists: false } },
        { startTime: null },
        { startTime: { $lte: now } },
      ],
      $or: [
        { endTime: { $exists: false } },
        { endTime: null },
        { endTime: { $gte: now } },
      ],
    }).sort({ createdAt: -1 });

    if (!activeQuiz) {
      return res.status(404).json({ message: "No active quiz right now" });
    }

    res.json(activeQuiz);
  } catch (err) {
    console.error("Active quiz error:", err);
    res.status(500).json({ message: "Server error fetching active quiz" });
  }
});


/* ==================== USER: Submit Quiz ==================== */
router.post("/submit/:id", authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers))
      return res.status(400).json({ message: "Answers array is required" });

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const now = new Date();
    if (quiz.startTime && quiz.endTime && (now < quiz.startTime || now > quiz.endTime))
      return res.status(400).json({ message: "Quiz is not currently active" });

    if (!quiz.participants.includes(req.user._id))
      return res.status(403).json({ message: "You must register before attempting the quiz" });

    const existingAttempt = await QuizAttempt.findOne({
      quiz: quiz._id,
      user: req.user._id,
    });
    if (existingAttempt)
      return res.status(400).json({ message: "Quiz already attempted" });

    // Evaluate answers
    let score = 0;
    let earnedCoins = 0;
    quiz.questions.forEach((q, i) => {
      const selected = answers[i];
      if (typeof selected === "number" && q.options[selected] === q.correctAnswer) {
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
      message: "Quiz submitted successfully",
      score,
      totalQuestions: quiz.questions.length,
      earnedCoins,
      newBalance: user.coins,
    });
  } catch (err) {
    console.error("Submit quiz error:", err);
    res.status(500).json({ message: "Server error submitting quiz" });
  }
});

/* ==================== USER: Get My Attempts ==================== */
router.get("/attempts/me", authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .populate("quiz", "title status createdAt")
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (err) {
    console.error("Get attempts error:", err);
    res.status(500).json({ message: "Server error fetching attempts" });
  }
});

export default router;
