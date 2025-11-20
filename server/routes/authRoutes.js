// server/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* ============================================
   USER REGISTER
   ============================================ */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    await newUser.save();

    console.log(`✅ Registered: ${newUser.email}`);
    return res
      .status(201)
      .json({ message: "User registered successfully. Please log in." });
  } catch (error) {
    console.error("🔥 Registration Error:", error);
    return res
      .status(500)
      .json({ message: "Server error during registration" });
  }
});

/* ============================================
   USER LOGIN
   ============================================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔍 Incoming login request:", { email });

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return res
        .status(400)
        .json({ message: "Invalid email or password format" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log("🚫 No user found for:", normalizedEmail);
      return res.status(404).json({ message: "User not found" });
    }

    // 🚫 Blocked check
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been blocked by admin.",
        reason: user.blockReason,
        blockedAt: user.blockTimestamp,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Invalid password for:", normalizedEmail);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // JWT Secret check BEFORE signing
    if (!process.env.JWT_SECRET) {
      console.error("❗ Missing JWT_SECRET in environment variables");
      return res.status(500).json({ message: "Server misconfiguration" });
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

    // ✅ Reset forced logout + update last login
    user.isLoggedOut = false;
    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        coins: user.coins,
        role: user.role,
        permissions: user.permissions, // useful for frontend UI decisions
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    console.error("🔥 Login Error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
});

export default router;
