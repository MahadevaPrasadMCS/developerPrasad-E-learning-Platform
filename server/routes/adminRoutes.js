import express from "express";
import Quiz from "../models/Quiz.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

/**
 * GET all quizzes (Admin only)
 */
router.get("/quizzes", adminMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ weekNumber: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST create new quiz (Admin only)
 */
router.post("/quiz", adminMiddleware, async (req, res) => {
  try {
    const { title, weekNumber, questions } = req.body;
    const quiz = new Quiz({ title, weekNumber, questions });
    await quiz.save();
    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * PUT toggle quiz activation
 */
router.put("/quiz/:id/toggle", adminMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    quiz.isActive = !quiz.isActive;
    await quiz.save();

    res.json({ message: `Quiz is now ${quiz.isActive ? "active" : "inactive"}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
