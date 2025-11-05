import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: [{ type: Number }], // index of chosen option per question
  score: { type: Number, required: true },
  earnedCoins: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const QuizAttempt = mongoose.model("QuizAttempt", attemptSchema);

export default QuizAttempt;
