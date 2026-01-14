import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ PRODUCTION-SAFE SMTP CONFIG
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // MUST be true for port 465
      auth: {
        user: process.env.CONTACT_FROM,
        pass: process.env.MAIL_PASS,
      },
    });

    // 🔎 Verify connection (CRITICAL)
    await transporter.verify();

    await transporter.sendMail({
      from: `"YouLearnHub Contact" <${process.env.CONTACT_FROM}>`,
      to: process.env.CONTACT_RECIEVER,
      replyTo: email,
      subject: `📩 Contact Message from ${name}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    return res.status(200).json({
      message: "✅ Message sent successfully",
    });
  } catch (error) {
    console.error("❌ CONTACT MAIL ERROR:", error.message);
    return res.status(500).json({
      message: "❌ Mail service error",
    });
  }
});

export default router;
