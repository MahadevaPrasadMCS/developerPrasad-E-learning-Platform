// server/models/Otp.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    otp: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    purpose: {
      type: String,
      enum: ["VERIFY_ACCOUNT", "RESET_PASSWORD"],
      default: "VERIFY_ACCOUNT",
    },
    attempts: { type: Number, default: 0 }, // optional rate-limiting
  },
  { timestamps: true }
);

// TTL index could be added if desired (Mongo 4.2+ supports partial TTL)
// But we already check expiry in code.
export default mongoose.model("Otp", otpSchema);
