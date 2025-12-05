// server/models/ResetToken.js
import mongoose from "mongoose";

const resetTokenSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// TTL index — MongoDB will remove expired tokens automatically
resetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("ResetToken", resetTokenSchema);
