// server/utils/sendEmail.js
import sgMail from "@sendgrid/mail";

export default async function sendEmail({ to, subject, text, html }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("❌ SENDGRID_API_KEY missing — email not sent");
    return { success: false, error: "Email not configured" };
  }

  if (!process.env.CONTACT_FROM) {
    console.warn("❌ MAIL_FROM missing — email not sent");
    return { success: false, error: "Sending address not configured" };
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to,
    from: process.env.CONTACT_FROM, // MUST be verified in SendGrid
    subject,
    text: text || undefined,
    html: html || undefined,
  };

  console.log("📨 Attempting to send email via SendGrid...");
  console.log("👉 To:", to);
  console.log("👉 Subject:", subject);

  try {
    const response = await sgMail.send(msg);

    console.log("✅ Email sent successfully via SendGrid!");
    console.log("📬 Status Code:", response[0].statusCode);
    console.log("➡️ Headers:", response[0].headers);

    return { success: true, response };
  } catch (error) {
    console.error("❌ SendGrid Email Error!");

    if (error.response) {
      console.error("Response Error:", error.response.body);
    }

    console.error("Reason:", error.message);
    return { success: false, error: error.message };
  }
}
