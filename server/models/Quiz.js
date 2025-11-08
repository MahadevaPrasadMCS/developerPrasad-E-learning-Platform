import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => v.length >= 2,
      message: "Each question must have at least two options",
    },
  },
  correctAnswer: { type: String, required: true },
  coins: { type: Number, default: 10 },
});

// Main Quiz schema
const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "Quiz must contain at least one question",
      },
    },

    status: {
      type: String,
      enum: ["draft", "published", "expired"],
      default: "draft",
    },

    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },

    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-update timestamps on save
quizSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
