import express from "express";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

/* =========================================================
1️⃣ CREATE QUIZ (Admin only)
========================================================= */
router.post("/create", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    if (!title || !Array.isArray(questions) || !questions.length)
      return res.status(400).json({ message: "Title and at least one question required." });

    for (const q of questions) {
      if (!q.question || !q.options?.length || q.correctAnswer == null)
        return res.status(400).json({ message: "Each question must have text, options, and correct answer." });
    }

    const quiz = new Quiz({ title, description, questions, status: "draft" });
    await quiz.save();

    console.log("✅ Quiz created:", quiz._id, "by", req.user?.email || "unknown");
    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (err) {
    console.error("Quiz creation error:", err);
    res.status(500).json({ message: "Failed to create quiz" });
  }
});

/* =========================================================
2️⃣ LIST ALL QUIZZES
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

router.get("/active", async (req, res) => {
  try {
    const now = new Date();
    const quizzes = await Quiz.find({
      status: "published",
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).select("title description questions startTime endTime"); // ✅ include questions
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: "Failed to load active quiz" });
  }
});

/* =========================================================
4️⃣ GET QUIZ BY ID (Admin only)
========================================================= */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    console.error("Get quiz error:", err);
    res.status(500).json({ message: "Failed to fetch quiz details" });
  }
});

/* =========================================================
5️⃣ UPDATE QUIZ (Admin only)
========================================================= */
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, questions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid quiz ID" });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (Array.isArray(questions)) quiz.questions = questions;

    await quiz.save();

    console.log("✏️ Quiz updated:", id, "by", req.user?.email || "unknown");
    res.json({ message: "Quiz updated successfully", quiz });
  } catch (err) {
    console.error("Quiz update error:", err);
    res.status(500).json({ message: "Failed to update quiz" });
  }
});

/* =========================================================
6️⃣ REGISTER FOR QUIZ
========================================================= */
router.post("/register/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid quiz ID" });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.status !== "published")
      return res.status(400).json({ message: "Quiz is not currently active." });

    const already = quiz.participants?.some((p) => String(p) === String(req.user._id));
    if (already) return res.status(400).json({ message: "Already registered for this quiz." });

    quiz.participants.push(req.user._id);
    await quiz.save();

    console.log("📝 Registered:", req.user.email, "for quiz", id);
    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Failed to register for quiz" });
  }
});

/* =========================================================
7️⃣ SUBMIT QUIZ ANSWERS
========================================================= */
router.post("/submit/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid quiz ID" });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const alreadyParticipant = quiz.participants?.some((p) => String(p) === String(req.user._id));
    if (!alreadyParticipant) {
      quiz.participants.push(req.user._id);
      await quiz.save();
    }

    if (!Array.isArray(answers) || answers.length !== quiz.questions.length)
      return res.status(400).json({ message: "Invalid answers submitted" });

    const existing = await QuizAttempt.findOne({ quizId: quiz._id, userId: req.user._id });
    if (existing) return res.status(400).json({ message: "You have already attempted this quiz." });

    let score = 0;
    let earnedCoins = 0;

    quiz.questions.forEach((q, i) => {
      const correctIndex = q.options.indexOf(q.correctAnswer);
      if (answers[i] === correctIndex) {
        score++;
        earnedCoins += q.coins || 10;
      }
    });

    const attempt = new QuizAttempt({
      quizId: quiz._id,
      userId: req.user._id,
      userName: req.user.name,
      answers,
      score,
      earnedCoins,
    });

    await attempt.save();

    const user = await User.findById(req.user._id);
    user.coins = (user.coins || 0) + earnedCoins;
    await user.save();

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) wallet = new Wallet({ user: req.user._id, transactions: [] });

    wallet.transactions.push({
      type: "earn",
      amount: earnedCoins,
      description: `Earned from quiz: ${quiz.title}`,
    });
    await wallet.save();

    console.log("✅ Quiz submitted:", quiz._id, "by", req.user.email, "score:", score, "coins:", earnedCoins);

    res.json({
      message: "Quiz submitted successfully",
      score,
      totalQuestions: quiz.questions.length,
      earnedCoins,
      newBalance: user.coins,
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ message: "Failed to submit quiz" });
  }
});

/* =========================================================
8️⃣ FETCH USER ATTEMPTS
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
9️⃣ DELETE QUIZ (Admin)
========================================================= */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid quiz ID" });

    await Quiz.findByIdAndDelete(id);
    console.log("🗑️ Quiz deleted:", id, "by", req.user.email);
    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Failed to delete quiz" });
  }
});

/* =========================================================
🔟 PUBLISH & UNPUBLISH QUIZZES
========================================================= */
router.put("/publish/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    if (!startTime || !endTime)
      return res.status(400).json({ message: "Start and end time required" });

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { startTime, endTime, status: "published" },
      { new: true }
    );

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    console.log("📣 Quiz published:", quiz._id);
    res.json({ message: "Quiz published successfully", quiz });
  } catch (err) {
    console.error("Publish error:", err);
    res.status(500).json({ message: "Failed to publish quiz" });
  }
});

router.put("/unpublish/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: "draft", startTime: null, endTime: null },
      { new: true }
    );
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    console.log("⏸️ Quiz unpublished:", req.params.id);
    res.json({ message: "Quiz unpublished successfully", quiz });
  } catch (err) {
    console.error("Unpublish error:", err);
    res.status(500).json({ message: "Failed to unpublish quiz" });
  }
});

/* =========================================================
1️⃣2️⃣ QUIZ ANALYTICS (Admin) — Enhanced
========================================================= */
router.get("/:id/analytics", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid quiz ID" });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const attempts = await QuizAttempt.find({ quizId: id });
    if (!attempts.length)
      return res.json({
        totalUsers: 0,
        averageScore: 0,
        successRate: 0,
        performers: [],
      });

    const totalQuestions = quiz.questions.length;

    const userMap = new Map();
    attempts.forEach((a) => {
      const userId = a.userId?.toString() || a.userName || "anonymous";
      const percent = ((a.score || 0) / totalQuestions) * 100;

      if (!userMap.has(userId) || userMap.get(userId).percent < percent) {
        userMap.set(userId, {
          name: a.userName || "Anonymous",
          percent,
          score: a.score,
        });
      }
    });

    const users = Array.from(userMap.values());
    const totalUsers = users.length;

    const totalPercent = users.reduce((sum, u) => sum + u.percent, 0);
    const averageScore = totalPercent / totalUsers;

    const HIGH_PERFORMANCE_THRESHOLD = 60;
    const highPerformers = users.filter((u) => u.percent >= HIGH_PERFORMANCE_THRESHOLD);
    const successRate =
      highPerformers.length > 0
        ? highPerformers.reduce((sum, u) => sum + u.percent, 0) / highPerformers.length
        : 0;

    const performers = users
      .sort((a, b) => b.percent - a.percent)
      .map((u) => ({
        name: u.name,
        score: u.score,
        percent: u.percent.toFixed(2),
      }));

    res.json({
      totalUsers,
      averageScore,
      successRate,
      performers,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Server error fetching quiz analytics" });
  }
});

/* =========================================================
1️⃣3️⃣ USER QUIZ STATUS (Now includes totalQuestions + earnedCoins)
========================================================= */
router.get("/status/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all published quizzes with questions
    const quizzes = await Quiz.find({ status: "published" }).select("title description questions");

    // Fetch user's attempts
    const attempts = await QuizAttempt.find({ userId })
      .select("quizId score earnedCoins createdAt");

    // Combine quiz + attempt data
    const statusList = quizzes.map((quiz) => {
      const attempt = attempts.find((a) => String(a.quizId) === String(quiz._id));

      if (attempt) {
        const totalQuestions = quiz.questions.length;
        const accuracy = ((attempt.score / totalQuestions) * 100).toFixed(2);
        return {
          _id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          attempted: true,
          score: attempt.score,
          totalQuestions,
          accuracy,
          earnedCoins: attempt.earnedCoins,
          attemptedAt: attempt.createdAt,
        };
      } else {
        return {
          _id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          attempted: false,
        };
      }
    });

    res.json(statusList);
  } catch (err) {
    console.error("Status fetch error:", err);
    res.status(500).json({ message: "Failed to fetch quiz statuses" });
  }
});

/* =========================================================
🧩 PUBLIC UPCOMING QUIZZES (For Explore Page)
========================================================= */
router.get("/upcoming", async (req, res) => {
  try {
    const now = new Date();
    const upcoming = await Quiz.find({
      startTime: { $gt: now },
      status: { $in: ["draft", "scheduled", "published"] }, // Include published future ones
    })
      .sort({ startTime: 1 })
      .limit(6)
      .select("title startTime");

    if (!upcoming.length)
      return res.json([
        { _id: 1, title: "No upcoming quizzes right now", date: "TBA" },
      ]);

    res.json(
      upcoming.map((q) => ({
        _id: q._id,
        title: q.title,
        date: q.startTime
          ? new Date(q.startTime).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "TBA",
      }))
    );
  } catch (err) {
    console.error("Public upcoming quiz fetch error:", err);
    res.status(500).json({ message: "Failed to load upcoming quizzes" });
  }
});

export default router;
