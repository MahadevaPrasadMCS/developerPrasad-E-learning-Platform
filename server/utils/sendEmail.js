// server/utils/sendEmail.js
import nodemailer from "nodemailer";

export default async function sendEmail({ to, subject, text, html }) {
  if (!process.env.CONTACT_RECEIVER || !process.env.MAIL_PASS) {
    console.warn("Email not configured: MAIL_USER or MAIL_PASS missing");
    // Prefer failing silently in dev — but throw in prod if you want
    return;
  }

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

  return transporter.sendMail(mailOptions);
}
