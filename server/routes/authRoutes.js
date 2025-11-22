// server/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import SystemLog from "../models/SystemLog.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Helper: Normalize Email
const normalizeEmail = (email) => String(email).toLowerCase().trim();

/* ==============================
   REGISTER
=================================*/
router.post("/register", async (req, res) => {
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
      action: "REGISTER",
      targetUser: user._id,
      details: { email: user.email },
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please log in.",
    });
  } catch (err) {
    console.error("Register Error:", err);
    return res
      .status(500)
      .json({ message: "Server error during registration" });
  }
});

/* ==============================
   LOGIN
=================================*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email & Password required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Account blocked by admin",
        reason: user.blockReason,
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❗ JWT_SECRET missing");
      return res
        .status(500)
        .json({ message: "Server misconfiguration" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        sessionVersion: user.sessionVersion,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.isLoggedOut = false;
    user.lastLogin = new Date();
    await user.save();

    await SystemLog.create({
      actor: user._id,
      action: "LOGIN",
      targetUser: user._id,
      details: { email: user.email },
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
        permissions: user.permissions || [],
        avatarUrl: user.avatarUrl || null,
        bio: user.bio || "",
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res
      .status(500)
      .json({ message: "Server error during login" });
  }
});

/* ==============================
   ME (profile)  🔒
   GET /api/auth/me
=================================*/
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = req.user; // from authMiddleware

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
    console.error("Me Error:", err);
    return res.status(500).json({ message: "Failed to load profile" });
  }
});

/* ==============================
   UPDATE PROFILE  🔒
   PATCH /api/auth/update
=================================*/
router.patch("/update", authMiddleware, async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }

    if (typeof bio === "string") {
      user.bio = bio.trim();
    }

    if (typeof avatarUrl === "string") {
      user.avatarUrl = avatarUrl;
    }

    await user.save();

    await SystemLog.create({
      actor: user._id,
      action: "PROFILE_UPDATE",
      targetUser: user._id,
      details: { hasAvatar: !!avatarUrl },
    });

    return res.json({
      message: "Profile updated",
      user: {
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
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update profile" });
  }
});

export default router;
