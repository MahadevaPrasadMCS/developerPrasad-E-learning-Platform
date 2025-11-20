// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import compression from "compression";
import cron from "node-cron";
import Quiz from "./models/Quiz.js";
import { startQuizExpiryJob } from "./cron/quizExpiryJob.js";
import { connectDB } from "./config/db.js";
import authMiddleware from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// ==================================================
// CORS CONFIG
// ==================================================
const allowedOrigins = [
  "http://localhost:3000",
  "https://youlearnhub-dp.vercel.app",
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

// Request Logging
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP:${req.ip}`
  );
  next();
});

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ==================================================
// MongoDB Initialization
// ==================================================
await connectDB();

// ==================================================
// Route Imports
// ==================================================
import authRoutes from "./routes/authRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import adminControlRoutes from "./routes/adminControlRoutes.js";
import adminStatsRoutes from "./routes/adminStatsRoutes.js";
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

// CEO + Logs Routes
import roleRoutes from "./routes/roleRoutes.js";
import logRoutes from "./routes/logRoutes.js";

// ==================================================
// Apply Routes in Clean Order
// ==================================================

// Public Auth Routes (no token required)
app.use("/api/auth", authRoutes);

// Everything below this line requires valid JWT
app.use(authMiddleware);

// User Features (protected)
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/quiz", quizUserRoutes);
app.use("/api/tutorials", tutorialRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/contact", contactRoutes);

// Community & Announcements (protected)
app.use("/api/community", communityRoutes);
app.use("/api/announcements", announcementRoutes);

// CEO Governance (protected, further restricted in those route files with RBAC)
app.use("/api/ceo/roles", roleRoutes);
app.use("/api/logs", logRoutes);

// Admin Panel (protected, RBAC inside routes)
app.use("/api/admin", adminUserRoutes);
app.use("/api/admin/control", adminControlRoutes);
app.use("/api/admin/stats", adminStatsRoutes);

// Quiz Admin
app.use("/api/quiz/admin", quizAdminRoutes);

// Rewards + Resources
app.use("/api/rewards", rewardRoutes);
app.use("/api/resources", resourceRoutes);

// Root
app.get("/", (req, res) => {
  res.json({ msg: "Backend connected successfully 🚀" });
});

// ==================================================
// Cron Job: Auto Unpublish Quiz
// ==================================================
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

startQuizExpiryJob();

// ==================================================
// Start Server
// ==================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
