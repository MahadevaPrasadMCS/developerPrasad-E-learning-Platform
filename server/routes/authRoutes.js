// server/routes/authRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  registerUser,
  loginUser,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  updateAvatar,
} from "../controllers/authController.js";

const router = express.Router();

// Public auth
router.post("/register", registerUser);
router.post("/login", loginUser);

// OTP / Forgot / Reset (public)
router.post("/send-otp", sendOTP); // body: { email, purpose? }
router.post("/verify-otp", verifyOTP); // body: { otp, email? }

router.post("/forgot-password", forgotPassword); // body: { email }
router.post("/reset-password", resetPassword); // body: { email, otp, password }

// Authenticated profile routes
router.get("/me", authMiddleware, getMe);
router.patch("/update", authMiddleware, updateProfile);
router.patch("/update-avatar", authMiddleware, updateAvatar);

export default router;
