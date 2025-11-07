import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // ✅ Admin control fields
    isBlocked: { type: Boolean, default: false }, // for temporary suspensions
    isLoggedOut: { type: Boolean, default: false }, // for force logout tracking

    // Optional but useful for analytics and activity logs
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true } // createdAt and updatedAt automatically
);

const User = mongoose.model("User", userSchema);
export default User;
