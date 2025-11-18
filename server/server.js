// server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import compression from "compression";
import cron from "node-cron";
import Quiz from "./models/Quiz.js";
import { startQuizExpiryJob } from "./cron/quizExpiryJob.js";

dotenv.config();
const app = express();

app.set("trust proxy", 1);

// ==================================================
// CORS CONFIGURATION
// ==================================================
const allowedOrigins = [
  "http://localhost:3000",
  "https://youlearnhub-dp.vercel.app",
  "https://youlearnhub.vercel.app",
  "https://youlearnhub.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS: Unauthorized origin"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Auth-Role"],
  })
);

// ==================================================
// Middleware
// ==================================================
app.use(express.json());
app.use(compression());

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP:${req.ip}`
  );
  next();
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ==================================================
// MongoDB Connection
// ==================================================
mongoose.set("strictQuery", true);

async function connectDB() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    setTimeout(connectDB, 5000);
  }
}
await connectDB();

// ==================================================
// Route Imports
// ==================================================
import authRoutes from "./routes/authRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js"; // Admin Management
import adminControlRoutes from "./routes/adminControlRoutes.js"; // Permissions / block etc
import adminStatsRoutes from "./routes/adminStatsRoutes.js"; // Analytics
import quizAdminRoutes from "./routes/quizAdminRoutes.js";
import quizUserRoutes from "./routes/quizUserRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import rewardRoutes from "./routes/rewardRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import tutorialRoutes from "./routes/tutorialRoutes.js";
import youtubeRoutes from "./routes/youtubeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

// ==================================================
// Apply Routes (Best Order)
// ==================================================

// 🔐 Auth
app.use("/api/auth", authRoutes);

// 🛠 Admin Routes (correct order to avoid path conflicts)
app.use("/api/admin", adminUserRoutes);         // Core admin: users, logs, profile-change-requests
app.use("/api/admin/control", adminControlRoutes); // block/unblock, allow/deny edits
app.use("/api/admin/stats", adminStatsRoutes);  // Analytics & dashboard stats

// 🧩 User functionality
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// 🧠 Quiz system
app.use("/api/quiz/admin", quizAdminRoutes);
app.use("/api/quiz", quizUserRoutes);

// 🎓 Tutorials / YouTube
app.use("/api/tutorials", tutorialRoutes);
app.use("/api/youtube", youtubeRoutes); // renamed cleanly for future usage

// 🛒 Store + Rewards
app.use("/api/rewards", rewardRoutes);
app.use("/api/store", storeRoutes);

// 📢 Announcements + Community
app.use("/api/announcements", announcementRoutes);
app.use("/api/community", communityRoutes);

// 📩 Contact
app.use("/api/contact", contactRoutes);

// ==================================================
// Root Endpoint
// ==================================================
app.get("/", (req, res) => {
  res.json({ msg: "Backend connected successfully 🚀" });
});

// ==================================================
// Quiz Auto-Unpublish Cron Job
// ==================================================
mongoose.connection.once("open", () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const expired = await Quiz.updateMany(
        { status: "published", endTime: { $lt: now } },
        { status: "draft", startTime: null, endTime: null }
      );
      if (expired.modifiedCount > 0) {
        console.log(`⛔ Auto-unpublished: ${expired.modifiedCount}`);
      }
    } catch (err) {
      console.error("Auto-unpublish error:", err.message);
    }
  });
});

startQuizExpiryJob();

// ==================================================
// Start Server
// ==================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
