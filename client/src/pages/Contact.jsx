// client/src/pages/Contact.jsx
import React, { useState } from "react";
import { Send } from "lucide-react";
import api from "../utils/api"; // your existing axios instance

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus("⚠️ Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/contact", form);
      setStatus(res.data?.message || "✅ Message sent! I’ll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("Contact send error:", err);
      setStatus(
        err.response?.data?.message ||
          "❌ Failed to send message. Try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 px-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-4 text-center">
          Contact Me
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
          Have questions, feedback, or collaborations? Send a message — it will be delivered to my email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your Name"
            required
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Your Email"
            required
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Your Message"
            rows={5}
            required
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Send size={18} /> {loading ? "Sending..." : "Send Message"}
          </button>
        </form>

        {status && (
          <p className="mt-4 text-center text-teal-600 dark:text-teal-400">{status}</p>
        )}
      </div>
    </div>
  );
}

export default Contact;
