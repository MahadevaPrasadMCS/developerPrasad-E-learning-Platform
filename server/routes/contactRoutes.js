import express from "express";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import sgMail from "@sendgrid/mail";

const router = express.Router();

/* ============================================================
🛡️ Rate limit: 5 contact requests per hour per IP
============================================================ */
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many contact requests. Try again in an hour." },
});

/* ============================================================
📧 Configure SendGrid
============================================================ */
if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ Missing SENDGRID_API_KEY in environment variables!");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* ============================================================
📨 Contact form endpoint
============================================================ */
router.post(
  "/",
  limiter,
  [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters."),
    body("email").isEmail().withMessage("Invalid email format."),
    body("message")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Message must be at least 5 characters long."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0].msg;
      return res.status(400).json({ message: firstError });
    }

    const { name, email, message } = req.body;

    try {
      const msg = {
        to: process.env.CONTACT_RECEIVER,
        from: process.env.CONTACT_FROM,
        subject: `[YouLearnHub] New message from ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h3>📩 YouLearnHub Contact Form</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f1f5f9; padding: 10px; border-radius: 6px; white-space: pre-wrap;">
              ${message}
            </div>
            <hr/>
            <p style="font-size:12px; color:#64748b;">Sent from YouLearnHub Contact Form</p>
          </div>
        `,
      };

      await sgMail.send(msg);

      console.log(`✅ Contact email sent from ${name} <${email}>`);
      return res.json({ message: "✅ Message delivered successfully!" });
    } catch (err) {
      console.error("❌ SendGrid error:", err.message);
      if (err.response?.body?.errors) {
        console.error("SendGrid details:", err.response.body.errors);
      }
      return res
        .status(500)
        .json({ message: "Failed to send message. Please try again later." });
    }
  }
);

export default router;
