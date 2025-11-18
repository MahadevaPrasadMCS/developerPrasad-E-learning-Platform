import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String, default: null },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    blockTimestamp: { type: Date, default: null },

    isLoggedOut: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },

    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
