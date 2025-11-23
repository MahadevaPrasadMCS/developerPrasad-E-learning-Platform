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
import { getSystemSettings } from "./controllers/systemSettingsController.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// ==================================================
// CORS
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
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ==================================================
// Core Middleware
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
// MongoDB Connect
// ==================================================
await connectDB();

// ==================================================
// Route Imports — Organized by Layer
// ==================================================

// Public Auth Routes
import authRoutes from "./routes/authRoutes.js";

// CEO Governance Routes
import roleRoutes from "./routes/roleRoutes.js";
import ceoStatsRoutes from "./routes/ceoStatsRoutes.js";
import ceoUserRoutes from "./routes/ceoUserRoutes.js";
import systemSettingsRoutes from "./routes/systemSettingsRoutes.js";

// Logs Route
import logRoutes from "./routes/logRoutes.js";

// Promotion System Routes
import promotionRoutes from "./routes/promotionRoutes.js";
import roleChangesRoutes from "./routes/roleChangeRoutes.js";

// ==================================================
// Route Application
// ==================================================

//Public system settings access
app.get("/api/system/settings", getSystemSettings);

// Public
app.use("/api/auth", authRoutes);

// ⛔ Everything below requires valid JWT
app.use(authMiddleware);

// CEO role-management + analytics
app.use("/api/ceo/roles", roleRoutes);
app.use("/api/ceo/stats", ceoStatsRoutes);
app.use("/api/ceo/users", ceoUserRoutes);
app.use("/api/system", systemSettingsRoutes);

// Logs for CEO/Admin
app.use("/api/logs", logRoutes);

// Promotion Workflow
app.use("/api/promotions", promotionRoutes);
app.use("/api/demotion", roleChangesRoutes);

// Test root
app.get("/", (req, res) => {
  res.json({ msg: "Backend running successfully 🚀" });
});

// ==================================================
// Cron: Auto unpublish quizzes
// ==================================================
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const expired = await Quiz.updateMany(
      { status: "published", endTime: { $lt: now } },
      { status: "draft", startTime: null, endTime: null }
    );

    if (expired.modifiedCount > 0) {
      console.log(`⛔ Auto-unpublished quizzes: ${expired.modifiedCount}`);
    }
  } catch (err) {
    console.error("Auto-unpublish error:", err.message);
  }
});

startQuizExpiryJob();

// ==================================================
// Server Start
// ==================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server live: http://localhost:${PORT}`)
);
