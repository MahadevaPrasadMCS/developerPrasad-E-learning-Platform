import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.CONTACT_FROM,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"YouLearnHub Contact" <${process.env.CONTACT_FROM}>`,
      to: process.env.CONTACT_RECIEVER,
      replyTo: email,
      subject: `📩 Contact Message from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    res.status(200).json({
      message: "✅ Message sent successfully",
    });
  } catch (err) {
    console.error("Contact mail error:", err);
    res.status(500).json({
      message: "❌ Failed to send message",
    });
  }
});

export default router;
