import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    answers: { type: [Number], required: true }, // indices of selected options
    score: { type: Number, required: true },
    earnedCoins: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
export default QuizAttempt;
