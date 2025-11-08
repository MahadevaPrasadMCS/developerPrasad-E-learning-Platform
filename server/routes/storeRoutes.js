import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";
import upload from "../middleware/uploadMiddleware.js";
import Purchase from "../models/Purchase.js";
import express from "express";
import Resource from "../models/Resource.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* 📦 GET: All resources (Public)                                              */
/* -------------------------------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    console.error("Get resources error:", err);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
});

/* -------------------------------------------------------------------------- */
/* ⬆️ POST: Upload Resource (Admin Only)                                      */
/* -------------------------------------------------------------------------- */
router.post("/upload", adminMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { title, description, coinsRequired = 0, type = "pdf" } = req.body;

    const resource = new Resource({
      title,
      description,
      fileUrl: `/api/store/download/${req.file.filename}`,
      fileName: req.file.filename,
      type,
      coinsRequired: Number(coinsRequired) || 0,
      uploadedBy: req.user._id,
    });

    await resource.save();
    res.status(201).json({ message: "✅ Resource uploaded successfully", resource });
  } catch (err) {
    console.error("Upload resource error:", err);
    res.status(500).json({ message: "Resource upload failed" });
  }
});

/* -------------------------------------------------------------------------- */
/* ✏️ PUT: Edit Resource (Admin Only)                                        */
/* -------------------------------------------------------------------------- */
router.put("/:id", adminMiddleware, async (req, res) => {
  try {
    const { title, description, coinsRequired } = req.body;

    const updated = await Resource.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        coinsRequired: Number(coinsRequired) || 0,
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Resource not found" });

    res.json({ message: "✅ Resource updated successfully", resource: updated });
  } catch (err) {
    console.error("Edit resource error:", err);
    res.status(500).json({ message: "Failed to update resource" });
  }
});

/* -------------------------------------------------------------------------- */
/* ❌ DELETE: Remove Resource (Admin Only)                                    */
/* -------------------------------------------------------------------------- */
router.delete("/:id", adminMiddleware, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    const filePath = path.join(__dirname, "../uploads", resource.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: "🗑️ Resource deleted" });
  } catch (err) {
    console.error("Delete resource error:", err);
    res.status(500).json({ message: "Failed to delete resource" });
  }
});

/* -------------------------------------------------------------------------- */
/* 💰 POST: Redeem Resource (Auth Required)                                  */
/* -------------------------------------------------------------------------- */
router.post("/redeem", authMiddleware, async (req, res) => {
  try {
    const { resourceId } = req.body;
    if (!resourceId) return res.status(400).json({ message: "resourceId required" });

    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if ((user.coins || 0) < resource.coinsRequired)
      return res.status(400).json({ message: "Not enough coins" });

    const already = await Purchase.findOne({ user: user._id, fileName: resource.fileName });
    if (already)
      return res.status(400).json({ message: "You already purchased this resource" });

    user.coins = (user.coins || 0) - Number(resource.coinsRequired || 0);
    await user.save();

    const purchase = new Purchase({
      user: user._id,
      title: resource.title,
      type: resource.type,
      fileUrl: resource.fileUrl,
      fileName: resource.fileName,
      cost: resource.coinsRequired,
    });
    await purchase.save();

    res.json({
      message: `✅ Purchased ${resource.title}`,
      newBalance: user.coins,
      purchase,
    });
  } catch (err) {
    console.error("Redeem error:", err);
    res.status(500).json({ message: "Error processing purchase" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🧾 GET: My Purchases (Auth Required)                                      */
/* -------------------------------------------------------------------------- */
router.get("/my-purchases", authMiddleware, async (req, res) => {
  try {
    // ✅ Use req.user.id (middleware adds this from JWT)
    const userId = req.user.id || req.user._id;

    const purchases = await Purchase.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!purchases || purchases.length === 0) {
      return res.status(200).json([]); // empty list = no purchases yet
    }

    res.json(purchases);
  } catch (err) {
    console.error("My purchases error:", err);
    res.status(500).json({ message: "Failed to fetch purchases" });
  }
});


/* -------------------------------------------------------------------------- */
/* 📥 GET: Download Resource (Purchased Users Only)                           */
/* -------------------------------------------------------------------------- */
router.get("/download/:fileName", async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(__dirname, "../uploads", fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // ✅ Accept token from header, fallback header, or query
    const token =
      req.headers.authorization?.split(" ")[1] ||
      req.headers["x-access-token"] ||
      req.query.token;

    if (!token) {
      console.warn("⚠️ No token received for download request");
      return res.status(401).json({ message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = decoded.id || decoded._id;
    if (!userId)
      return res.status(400).json({ message: "Invalid token payload" });

    const purchase = await Purchase.findOne({ user: userId, fileName });
    if (!purchase)
      return res
        .status(403)
        .json({ message: "Access denied: not purchased this resource." });

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      ".pdf": "application/pdf",
      ".mp4": "video/mp4",
      ".txt": "text/plain",
      ".avi": "video/x-msvideo",
      ".mkv": "video/x-matroska",
    };
    const mimeType = mimeMap[ext] || "application/octet-stream";

    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filePath)}"`
    );

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on("end", () => res.end());
    stream.on("error", (err) => {
      console.error("File stream error:", err);
      res.status(500).json({ message: "Error reading file" });
    });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Server error during file download" });
  }
});

export default router;
