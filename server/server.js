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

app.set("trust proxy", 1); // Trust first proxy for rate limiting behind proxies

// ==================== Middleware ====================

// ✅ Allowed frontend origins (local + deployed)
const allowedOrigins = [
  "http://localhost:3000",
  "https://youlearnhub-dp.vercel.app",
  "https://youlearnhub.vercel.app", // future domain
  "https://youlearnhub.com" // custom domain (optional)
];

// ✅ CORS Configuration (clean & Render-safe)
// ✅ CORS Configuration (Improved for Render + Debug Logs)
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "https://youlearnhub-dp.vercel.app",
        "https://youlearnhub.vercel.app",
        "https://youlearnhub.com",
      ];

      // Allow requests with no origin (like mobile, Postman, Render health checks)
      if (!origin) {
        console.log("🌍 CORS allowed: internal or server-to-server request");
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS allowed origin: ${origin}`);
        return callback(null, true);
      }

      console.warn(`🚫 CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Auth-Role"],
    credentials: true,
    optionsSuccessStatus: 200, // ensures success on preflight OPTIONS
  })
);


// ✅ Core middlewares
app.use(express.json());
app.use(compression());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP:${req.ip}`);
  next();
});

// ✅ Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ==================== MongoDB Connection ====================
mongoose.set("strictQuery", true);

async function connectDB() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error("Retrying in 5s...");
    setTimeout(connectDB, 5000);
  }
}

await connectDB(); // ✅ Connect before anything else

// ==================== Import Routes ====================
import authRoutes from "./routes/authRoutes.js";
import TutorialRoutes from "./routes/tutorialRoutes.js";  
import quizRoutes from "./routes/quizRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import adminStatsRoutes from "./routes/adminStatsRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import adminControlRoutes from "./routes/adminControlRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import rewardRoutes from "./routes/rewardRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import tutorialRoutes from "./routes/youtubeRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

// ==================== Use Routes ====================
app.use("/api/auth", authRoutes);
app.use("/api/tutorials", TutorialRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/admin/stats", adminStatsRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/admin/control", adminControlRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/user", userRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/tutorials", tutorialRoutes);
app.use("/api/contact", contactRoutes);

// ==================== Root Route ====================
app.get("/", (req, res) => {
  res.json({ msg: "Backend connected successfully ✅" });
});

// ==================== Auto-Unpublish Cron Job ====================
mongoose.connection.once("open", () => {
  console.log("🕐 Cron job started after MongoDB connection established.");

  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const expired = await Quiz.updateMany(
        { status: "published", endTime: { $lt: now } },
        { status: "draft", startTime: null, endTime: null }
      );

      if (expired.modifiedCount > 0) {
        console.log(`⏰ Auto-unpublished ${expired.modifiedCount} expired quizzes`);
      }
    } catch (err) {
      console.error("⚠️ Auto-unpublish error:", err.message);
    }
  });
});

startQuizExpiryJob();

// ==================== Start Server ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
