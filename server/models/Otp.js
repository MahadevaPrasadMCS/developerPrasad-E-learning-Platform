// server/models/Otp.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },

    otp: { type: String, required: true, index: true },

    expiresAt: { type: Date, required: true, index: true },

    purpose: {
      type: String,
      enum: ["REGISTER", "RESET_PASSWORD"],
      required: true,
    },

    verified: {
      type: Boolean,
      default: false,
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Optional but recommended TTL (auto cleanup expired OTPs)
// otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", otpSchema);
