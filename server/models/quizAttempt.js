import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },

    // stores selected option index for each question
    answers: {
      type: [Number],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Answers must be a non-empty array",
      },
    },

    score: { type: Number, required: true },
    earnedCoins: { type: Number, default: 0 },

    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate attempts per user per quiz
quizAttemptSchema.index({ userId: 1, quizId: 1 }, { unique: true });

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
export default QuizAttempt;
