// server/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import SystemLog from "../models/SystemLog.js";

const router = express.Router();

// Helper: Normalize Email
const normalizeEmail = (email) => String(email).toLowerCase().trim();

/* ==============================
   REGISTER
=================================*/
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

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
      details: { email: user.email }
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please log in.",
    });

  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ message: "Server error during registration" });
  }
});

/* ==============================
   LOGIN
=================================*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & Password required" });

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).lean();

    if (!user)
      return res.status(404).json({ message: "Account not found" });

    if (user.isBlocked)
      return res.status(403).json({
        message: "Account blocked by admin",
        reason: user.blockReason,
      });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        sessionVersion: user.sessionVersion,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await User.findByIdAndUpdate(user._id, {
      isLoggedOut: false,
      lastLogin: new Date(),
    });

    await SystemLog.create({
      actor: user._id,
      action: "LOGIN",
      targetUser: user._id,
      details: { email: user.email }
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
        avatar: user.avatar || null,
        lastLogin: user.lastLogin,
      },
    });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
});

export default router;
