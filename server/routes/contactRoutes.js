import express from "express";
import sendEmail from "../utils/sendEmail.js";
import SystemLog from "../models/SystemLog.js";

const router = express.Router();

/**
 * POST /api/contact
 * body: { name, email, message }
 */
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
    const cleanEmail = String(email).toLowerCase().trim();
    const cleanMessage = message.trim();

    // -----------------------------
    // Log message (important)
    // -----------------------------
    await SystemLog.create({
      actor: null,
      action: "CONTACT_MESSAGE",
      details: {
        fromName: cleanName,
        fromEmail: cleanEmail,
        message: cleanMessage.slice(0, 500), // prevent log abuse
      },
      ip: req.ip,
    });

    // -----------------------------
    // Send email (NON-BLOCKING)
    // -----------------------------
    sendEmail({
      to: process.env.CONTACT_RECIEVER,
      subject: `📩 Contact Message from ${cleanName}`,
      text: `
New contact message received

Name: ${cleanName}
Email: ${cleanEmail}

Message:
${cleanMessage}
      `,
    }).catch((err) => {
      // NEVER crash request because of email
      console.warn("Contact email failed:", err?.message);
    });

    // -----------------------------
    // Success response (always)
    // -----------------------------
    return res.status(200).json({
      success: true,
      message: "Message received successfully. We’ll get back to you soon.",
    });

  } catch (err) {
    console.error("Contact Route Error:", err);

    // only real server failures come here
    return res.status(500).json({
      success: false,
      message: "Failed to process contact request",
    });
  }
});

export default router;
