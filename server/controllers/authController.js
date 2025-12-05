// server/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";
import SystemLog from "../models/SystemLog.js";
import Otp from "../models/Otp.js";
import ResetToken from "../models/ResetToken.js";
import sendEmail from "../utils/sendEmail.js";

const normalizeEmail = (email) => String(email).toLowerCase().trim();

// -----------------------------
// REGISTER
// POST /api/auth/register
// -----------------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    await SystemLog.create({
      actor: user._id,
      action: "PROFILE_UPDATE",
      target: user._id,
      details: { email: user.email, note: "New registration" },
    });

    // Create verification OTP (optional)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email: normalizedEmail, purpose: "VERIFY_ACCOUNT" });

    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      purpose: "VERIFY_ACCOUNT",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Send OTP email (non-blocking)
    sendEmail({
      to: normalizedEmail,
      subject: "Verify your YouLearnHub account",
      text: `Welcome ${user.name}! Use this OTP to verify your account: ${otpCode} (valid for 5 minutes)`,
    }).catch((err) => console.warn("OTP email failed:", err?.message));

    return res.status(201).json({
      success: true,
      message: "Account created successfully. OTP sent to email for verification.",
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// -----------------------------
// LOGIN
// POST /api/auth/login
// -----------------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & Password required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(404).json({ message: "Account not found" });

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Account blocked by admin",
        reason: user.blockReason,
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    if (!process.env.JWT_SECRET) {
      console.error("❗ JWT_SECRET missing");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, sessionVersion: user.sessionVersion },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.isLoggedOut = false;
    user.lastLogin = new Date();
    await user.save();

    await SystemLog.create({
      actor: user._id,
      action: "LOGIN",
      target: user._id,
      details: { email: user.email },
      ip: req.ip,
    });

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        coins: user.coins,
        role: user.role,
        permissions: user.permissions,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// -----------------------------
// SEND OTP (generic)
// POST /api/auth/send-otp
// body: { email, purpose }
// purposes: VERIFY_ACCOUNT | RESET_PASSWORD
// -----------------------------
export const sendOTP = async (req, res) => {
  try {
    const { email, purpose = "VERIFY_ACCOUNT" } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const normalizedEmail = normalizeEmail(email);

    // rate-limiting guard (1 minute cooldown)
    const existing = await Otp.findOne({
      email: normalizedEmail,
      purpose,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });
    if (existing) {
      return res
        .status(429)
        .json({ message: "Please wait before requesting another OTP" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email: normalizedEmail, purpose });

    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      purpose,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // Send via email (non-blocking)
    sendEmail({
      to: normalizedEmail,
      subject:
        purpose === "RESET_PASSWORD"
          ? "YouLearnHub — Password Reset OTP"
          : "YouLearnHub — Account Verification OTP",
      text:
        purpose === "RESET_PASSWORD"
          ? `Your password reset OTP: ${otpCode} (valid 5 minutes)`
          : `Your verification OTP: ${otpCode} (valid 5 minutes)`,
    }).catch((err) => console.warn("OTP send failed:", err?.message));

    await SystemLog.create({
      actor: null,
      action: "SECURITY_ALERT",
      details: { email: normalizedEmail, purpose, note: "OTP issued" },
    });

    return res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// -----------------------------
// VERIFY OTP
// POST /api/auth/verify-otp
// body: { otp, email? }
// If OTP found we remove it and return success
// For RESET_PASSWORD purpose, we also issue a short-lived reset token (Flow A)
// -----------------------------
export const verifyOTP = async (req, res) => {
  try {
    const { otp, email } = req.body;
    if (!otp) return res.status(400).json({ message: "OTP required" });

    const query = email
      ? { otp, email: normalizeEmail(email) }
      : { otp };

    const record = await Otp.findOne(query);
    if (!record) return res.status(400).json({ message: "Invalid OTP" });

    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "OTP expired" });
    }

    // Delete OTP after successful verify
    await Otp.deleteOne({ _id: record._id });

    await SystemLog.create({
      actor: null,
      action: "SECURITY_ALERT",
      details: { email: record.email, note: "OTP verified", purpose: record.purpose },
    });

    // If this OTP was for password reset, create a reset token and return it
    if (record.purpose === "RESET_PASSWORD") {
      // remove any previous tokens for this email
      await ResetToken.deleteMany({ email: record.email });

      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await ResetToken.create({
        email: record.email,
        token: resetToken,
        expiresAt,
      });

      return res.json({
        message: "OTP verified successfully",
        resetToken, // frontend will navigate to reset page with token
        expiresAt,
      });
    }

    // Normal verification (e.g. account verify)
    return res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

// -----------------------------
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// body: { email }
// -----------------------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        exists: false,
        message: "Email required",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    // If no user → tell frontend accurately (Avoiding false “OTP sent”)
    if (!user) {
      return res.status(404).json({
        success: false,
        exists: false,
        message: "No user found with this email",
      });
    }

    // ─────────────── send OTP ───────────────
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email: normalizedEmail, purpose: "RESET_PASSWORD" });

    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      purpose: "RESET_PASSWORD",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    });

    sendEmail({
      to: normalizedEmail,
      subject: "YouLearnHub — Password Reset OTP",
      text: `Your password reset OTP is ${otpCode}. It expires in 5 minutes.`,
    }).catch((err) =>
      console.warn("Password reset email failed:", err?.message)
    );

    await SystemLog.create({
      actor: user._id,
      action: "SECURITY_ALERT",
      details: { email: normalizedEmail, note: "Password reset OTP issued" },
    });

    return res.json({
      success: true,
      exists: true,
      message: "OTP sent to your email",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({
      success: false,
      exists: null,
      message: "Failed to process forgot password",
    });
  }
};


// -----------------------------
// RESET PASSWORD (Flow A)
// POST /api/auth/reset-password
// body: { token, password }
// -----------------------------
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ message: "Token and password required" });

    const tokenDoc = await ResetToken.findOne({ token });
    if (!tokenDoc) return res.status(400).json({ message: "Reset link expired or invalid" });

    if (tokenDoc.expiresAt < new Date()) {
      await ResetToken.deleteOne({ _id: tokenDoc._id });
      return res.status(400).json({ message: "Reset token expired" });
    }

    // Basic password validation: 8-15 alnum + special + uppercase (as frontend)
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 8-15 chars, include uppercase, number and special character",
      });
    }

    const normalizedEmail = normalizeEmail(tokenDoc.email);
    const hashed = await bcrypt.hash(password, 12);

    const updated = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { password: hashed },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    // delete all reset tokens for this email
    await ResetToken.deleteMany({ email: normalizedEmail });

    // bump sessionVersion to invalidate other sessions
    updated.sessionVersion = (updated.sessionVersion || 0) + 1;
    await updated.save();

    await SystemLog.create({
      actor: updated._id,
      action: "SECURITY_ALERT",
      details: { email: normalizedEmail, note: "Password reset completed" },
    });

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

// -----------------------------
// EXISTING getMe / updateProfile / updateAvatar
// -----------------------------
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      coins: user.coins,
      role: user.role,
      permissions: user.permissions || [],
      avatarUrl: user.avatarUrl || null,
      bio: user.bio || "",
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    });
  } catch (err) {
    console.error("GetMe Error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name.trim(),
        bio: bio?.trim() || "",
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ message: "Avatar URL required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Avatar updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Avatar update error:", err);
    res.status(500).json({ message: "Failed to update avatar" });
  }
};
