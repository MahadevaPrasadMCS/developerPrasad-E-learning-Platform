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
    answers: [Number],

    score: { type: Number, default: 0 },
    earnedCoins: { type: Number, default: 0 },

    // ⭐ NEW: Attempt Status
    status: {
      type: String,
      enum: ["completed", "invalidated"],
      default: "completed",
    },

    // ⭐ NEW: Security Violation Count
    violations: { type: Number, default: 0 },

    // ⭐ NEW: Tracking suspicious reason
    reason: { type: String, default: null },

    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique attempt per quiz per user
quizAttemptSchema.index(
  { userId: 1, quizId: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("QuizAttempt", quizAttemptSchema);
