// server/routes/contactRoutes.js
import express from "express";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields required" });
    }

    const result = await sendEmail({
      to: process.env.CONTACT_RECIEVER,
      subject: `📩 Contact Message from ${name}`,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `,
    });

    if (!result?.success) {
      return res.status(500).json({
        message: "Failed to send contact message",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (err) {
    console.error("Contact Route Error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
