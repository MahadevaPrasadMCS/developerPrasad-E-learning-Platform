import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: String,

    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    // Selected answer option index per question
    answers: {
      type: [Number],
      default: [],
    },

    score: { type: Number, default: 0 },
    earnedCoins: { type: Number, default: 0 },

    // ⭐ Attempt State
    status: {
      type: String,
      enum: ["started", "completed", "invalidated"],
      default: "started",
    },

    // ⭐ Security Violation Count
    violations: { type: Number, default: 0 },

    // ⭐ Why attempt was invalidated (if applicable)
    reason: { type: String, default: null },

    // Set only on successful submit
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Ensure unique attempt per quiz per user
quizAttemptSchema.index(
  { userId: 1, quizId: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("QuizAttempt", quizAttemptSchema);
