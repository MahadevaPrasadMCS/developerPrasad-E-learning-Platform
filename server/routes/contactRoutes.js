import express from "express";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";

const router = express.Router();

/* ============================================================
⏳ Rate limit: 5 requests/hour per IP
============================================================ */
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    message: "Too many contact requests from this IP. Try again later.",
  },
});

/* ============================================================
📧 Create transporter with SMTP credentials
============================================================ */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true", // true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/* ============================================================
📨 Contact form route with better error handling
============================================================ */
router.post(
  "/",
  limiter,
  [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters long."),
    body("email").isEmail().withMessage("Invalid email format."),
    body("message")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Message must be at least 5 characters long."),
  ],
  async (req, res) => {
    // ✅ Validate fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0].msg;
      return res.status(400).json({ message: firstError });
    }

    const { name, email, message } = req.body;

    try {
      const transporter = createTransporter();

      // Verify transporter before sending
      await transporter.verify();

      const mailOptions = {
        from: `"${name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: process.env.CONTACT_RECEIVER || process.env.SMTP_USER,
        subject: `[YouLearnHub] New message from ${name}`,
        text: `
YouLearnHub Contact Form

Name: ${name}
Email: ${email}
Message:
${message}

-- Sent from YouLearnHub
        `,
        html: `
          <div style="font-family: sans-serif; line-height: 1.5;">
            <h3>📩 YouLearnHub Contact Form</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <div style="white-space: pre-wrap; background:#f8fafc; padding:10px; border-radius:6px;">
              ${message}
            </div>
            <hr/>
            <p style="font-size:12px;color:#6b7280;">Sent from YouLearnHub</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      console.log(`✅ Contact message sent by: ${name} <${email}>`);
      return res.json({ message: "Message delivered successfully. Thank you!" });
    } catch (err) {
      console.error("❌ Contact send error:", err.message);

      // Handle specific SMTP errors
      if (err.code === "EAUTH") {
        return res
          .status(500)
          .json({ message: "Email authentication failed. Check SMTP credentials." });
      }
      if (err.code === "ENOTFOUND" || err.code === "ECONNECTION") {
        return res
          .status(500)
          .json({ message: "Mail server connection failed. Try again later." });
      }

      return res
        .status(500)
        .json({ message: "Failed to send message. Please try again later." });
    }
  }
);

export default router;
