import mongoose from "mongoose";

const tutorialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    thumbnail: { type: String },
    videoUrl: { type: String }, // optional for future use
  },
  { timestamps: true }
);

export default mongoose.model("Tutorial", tutorialSchema);
