// server/utils/sendEmail.js
import nodemailer from "nodemailer";

export default async function sendEmail({ to, subject, text, html }) {
  // Validate environment variables
  if (!process.env.CONTACT_RECIEVER || !process.env.MAIL_PASS) {
    console.warn(
      "⚠️ Email not configured: MAIL_USER or MAIL_PASS missing. Email was NOT sent."
    );
    return { success: false, error: "Email service not configured" };
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to,
      subject,
      text: text || undefined,
      html: html || undefined,
    };

    console.log("📨 Attempting to send email...");
    console.log("👉 To:", to);
    console.log("👉 Subject:", subject);

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully!");
    console.log("📬 Message ID:", info.messageId);
    console.log("➡️ SMTP Info:", info.response);

    return { success: true, messageId: info.messageId, info };
  } catch (error) {
    console.error("❌ Email sending failed!");
    console.error("Reason:", error.message || error);
    return { success: false, error: error.message };
  }
}
