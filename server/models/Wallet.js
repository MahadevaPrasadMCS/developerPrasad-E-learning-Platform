import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["earn", "spend"], required: true },
    amount: { type: Number, required: true },
    description: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);
