import express from "express";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/quizAttempt.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

/* =========================================================
📌 CREATE QUIZ
========================================================= */
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
    res.status(500).json({ message: "Failed to create quiz" });
  }
});

/* =========================================================
📌 ADMIN QUIZ LIST
========================================================= */
router.get("/list", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
    const skip = (page - 1) * limit;

    const [quizzes, totalQuizzes] = await Promise.all([
      Quiz.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Quiz.countDocuments(),
    ]);

    res.json({
      quizzes,
      totalQuizzes,
      totalPages: Math.ceil(totalQuizzes / limit),
      currentPage: page,
      pageSize: limit,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load quizzes" });
  }
});

/* =========================================================
📌 UPDATE QUIZ
========================================================= */
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

/* =========================================================
📌 DELETE QUIZ
========================================================= */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: "Quiz deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

/* =========================================================
📌 PUBLISH / UNPUBLISH
========================================================= */
router.put("/publish/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    if (!startTime || !endTime)
      return res.status(400).json({ message: "Provide timing" });

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: "published", startTime, endTime },
      { new: true }
    );

    res.json({ message: "Quiz published", quiz });
  } catch (err) {
    res.status(500).json({ message: "Publish failed" });
  }
});

router.put("/unpublish/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: "draft", startTime: null, endTime: null },
      { new: true }
    );
    res.json({ message: "Quiz unpublished", quiz });
  } catch (err) {
    res.status(500).json({ message: "Unpublish failed" });
  }
});

/* =========================================================
📌 ANALYTICS (with filtering support)
========================================================= */
router.get("/:id/analytics", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { filter = "completed" } = req.query;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const query = { quizId: req.params.id };
    if (filter !== "all") query.status = filter;

    const attempts = await QuizAttempt.find(query).lean();
    const totalQuestions = quiz.questions.length;
    const totalUsers = attempts.length;

    const performers = attempts.map((a) => {
      const percent = totalQuestions
        ? ((a.score / totalQuestions) * 100).toFixed(2)
        : "0.00";
      return {
        name: a.userName,
        score: a.score,
        percent,
        status: a.status,
        violations: a.violations,
      };
    });

    const averageScore =
      performers.reduce((sum, p) => sum + parseFloat(p.percent), 0) /
      (totalUsers || 1);

    const successRate =
      (performers.filter((p) => parseFloat(p.percent) >= 60).length /
        (totalUsers || 1)) *
      100;

    res.json({
      quizId: quiz._id,
      title: quiz.title,
      totalUsers,
      averageScore: Number(averageScore.toFixed(2)),
      successRate: Number(successRate.toFixed(2)),
      performers,
    });
  } catch (err) {
    res.status(500).json({ message: "Analytics failed" });
  }
});

/* =========================================================
📌 REWARD TOP PERFORMERS
========================================================= */
router.post("/:id/reward", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { topPercent = 60, coins = 20 } = req.body;
    const attempts = await QuizAttempt.find({
      quizId: req.params.id,
      status: "completed",
    }).populate("userId");

    let count = 0;

    for (const a of attempts) {
      const percent = ((a.score / a.answers.length) * 100).toFixed(2);
      if (percent >= topPercent) {
        a.userId.coins += coins;
        await a.userId.save();
        count++;
      }
    }

    res.json({ message: "Rewards distributed", rewardedCount: count });
  } catch (err) {
    res.status(500).json({ message: "Reward distribution failed" });
  }
});

export default router;
