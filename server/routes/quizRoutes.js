import express from "express";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import User from "../models/User.js"; // ✅ Needed for reward/coin updates
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

/* =========================================================
🧩 1️⃣ CREATE QUIZ (Admin only)
POST /api/quiz/create
========================================================= */
router.post("/create", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Title and at least one question are required." });
    }

    for (const q of questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length === 0)
        return res.status(400).json({ message: "Each question must have text and options." });
      if (!q.correctAnswer)
        return res.status(400).json({ message: "Each question must have a correct answer." });
    }

    const quiz = new Quiz({
      title,
      description,
      questions,
      status: "draft",
    });

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
    const now = new Date();
    const quizzes = await Quiz.find().sort({ createdAt: -1 });

    for (const quiz of quizzes) {
      if (quiz.endTime && now > quiz.endTime && quiz.status === "published") {
        quiz.status = "expired";
        await quiz.save();
      }
    }

    res.json(quizzes);
  } catch (err) {
    console.error("Quiz list error:", err);
    res.status(500).json({ message: "Failed to load quizzes" });
  }
});

/* =========================================================
🔥 3️⃣ GET ACTIVE QUIZ (for participants)
GET /api/quiz/active
========================================================= */
router.get("/active", async (req, res) => {
  try {
    const now = new Date();
    const quiz = await Quiz.findOne({
      status: "published",
      startTime: { $lte: now },
      endTime: { $gte: now },
    });

    if (!quiz)
      return res.status(404).json({ message: "No active quiz right now" });

    res.json(quiz);
  } catch (err) {
    console.error("Active quiz fetch error:", err);
    res.status(500).json({ message: "Failed to load active quiz" });
  }
});

/* =========================================================
🧾 4️⃣ REGISTER FOR QUIZ
POST /api/quiz/register/:id
========================================================= */
router.post("/register/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid quiz ID" });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.participants?.includes(req.user._id)) {
      return res.status(400).json({ message: "Already registered for this quiz" });
    }

    quiz.participants = quiz.participants || [];
    quiz.participants.push(req.user._id);
    await quiz.save();

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Failed to register for quiz" });
  }
});

/* =========================================================
✏️ 5️⃣ SUBMIT QUIZ ANSWERS
POST /api/quiz/submit/:id
========================================================= */
router.post("/submit/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid quiz ID" });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: "Invalid answers submitted" });
    }

    let score = 0;
    let earnedCoins = 0;

    quiz.questions.forEach((q, i) => {
      const correctIndex = q.options.indexOf(q.correctAnswer);
      if (answers[i] === correctIndex) {
        score++;
        earnedCoins += q.coins || 10;
      }
    });

    const totalQuestions = quiz.questions.length;
    const percentage = (score / totalQuestions) * 100;

    // Save attempt
    const attempt = new QuizAttempt({
      quizId: quiz._id,
      userId: req.user._id,
      userName: req.user.name,
      answers,
      score,
      earnedCoins,
    });
    await attempt.save();

    // Update user wallet
    const user = await User.findById(req.user._id);
    if (user) {
      user.wallet = (user.wallet || 0) + earnedCoins;
      await user.save();
    }

    res.json({
      message: "✅ Quiz submitted successfully",
      score,
      totalQuestions,
      earnedCoins,
      newBalance: user?.wallet || 0,
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ message: "Failed to submit quiz" });
  }
});

/* =========================================================
📜 6️⃣ FETCH USER ATTEMPTS
GET /api/quiz/attempts/me
========================================================= */
router.get("/attempts/me", authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user._id })
      .populate("quizId", "title description")
      .sort({ createdAt: -1 });
    res.json(attempts);
  } catch (err) {
    console.error("Attempt fetch error:", err);
    res.status(500).json({ message: "Failed to fetch attempts" });
  }
});

/* =========================================================
🗑️ 7️⃣ DELETE QUIZ (Admin only)
DELETE /api/quiz/:id
========================================================= */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid quiz ID" });

    await Quiz.findByIdAndDelete(id);
    res.json({ message: "🗑️ Quiz deleted successfully" });
  } catch (err) {
    console.error("Quiz delete error:", err);
    res.status(500).json({ message: "Failed to delete quiz" });
  }
});

/* =========================================================
🚀 8️⃣ PUBLISH QUIZ (Admin only)
PUT /api/quiz/publish/:id
========================================================= */
router.put("/publish/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime)
      return res.status(400).json({ message: "Start and end times are required." });

    const quiz = await Quiz.findByIdAndUpdate(
      id,
      { startTime, endTime, status: "published" },
      { new: true }
    );

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    res.json({ message: "✅ Quiz published successfully", quiz });
  } catch (err) {
    console.error("Publish error:", err);
    res.status(500).json({ message: "Failed to publish quiz" });
  }
});

/* =========================================================
⏸️ 9️⃣ UNPUBLISH QUIZ (Admin only)
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

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    res.json({ message: "⚠️ Quiz unpublished", quiz });
  } catch (err) {
    console.error("Unpublish error:", err);
    res.status(500).json({ message: "Failed to unpublish quiz" });
  }
});

/* =========================================================
📊 🔟 QUIZ ANALYTICS (Admin only)
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
    const successCount = attempts.filter((a) => a.score >= 50).length;
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
