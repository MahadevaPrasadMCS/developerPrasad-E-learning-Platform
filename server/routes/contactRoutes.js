// server/routes/contactRoutes.js
import express from "express";
import sendEmail from "../utils/sendEmail.js";
import SystemLog from "../models/SystemLog.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // -----------------------------
    // Validation
    // -----------------------------
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanMessage = message.trim();

    // -----------------------------
    // Audit Log (SAFE)
    // -----------------------------
    try {
      await SystemLog.create({
        actor: null,
        actorRole: "system",
        action: "SECURITY_ALERT", // ✅ valid enum
        details: {
          type: "CONTACT_MESSAGE",
          fromName: cleanName,
          fromEmail: cleanEmail,
          preview: cleanMessage.slice(0, 200),
        },
        ip: req.ip,
      });
    } catch (logErr) {
      // Never allow audit logging to break API
      console.warn("SystemLog failed:", logErr.message);
    }

    // -----------------------------
    // Email (NON-BLOCKING)
    // -----------------------------
    sendEmail({
      to: process.env.CONTACT_RECIEVER,
      subject: `📩 Contact Message from ${cleanName}`,
      text: `Name: ${cleanName}\nEmail: ${cleanEmail}\n\n${cleanMessage}`,
    }).catch((err) =>
      console.warn("Contact email failed:", err.message)
    );

    // -----------------------------
    // Response
    // -----------------------------
    return res.json({
      success: true,
      message: "Message received successfully. We’ll get back to you soon.",
    });

  } catch (err) {
    console.error("Contact Route Fatal Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to process contact request",
    });
  }
});

export default router;
