import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  coins: { type: Number, default: 10 },
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  questions: [questionSchema],
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
