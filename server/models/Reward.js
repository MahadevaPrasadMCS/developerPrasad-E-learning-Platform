import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coins: { type: Number, required: true },
  reason: { type: String, required: true },
  admin: { type: String }, // who gave the reward
  createdAt: { type: Date, default: Date.now },
});

const Reward = mongoose.model("Reward", rewardSchema);

export default Reward;
