import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 0 }, // updated automatically after quiz
    role: { type: String, enum: ["user", "admin"], default: "user" },

    isBlocked: { type: Boolean, default: false },
    isLoggedOut: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
