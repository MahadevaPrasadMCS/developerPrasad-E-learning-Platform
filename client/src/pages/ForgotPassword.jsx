// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import api from "../utils/api";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Mail, AlertCircle, ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(true);

  const checkEmailFormat = (value) => {
    setEmail(value);
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setEmailValid(ok || value === "");
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!emailValid) return toast.error("Please enter a valid email.");

    try {
      setLoading(true);

      await api.post("/auth/forgot-password", { email });
      toast.success("OTP sent to your email.");

      setTimeout(() => {
        navigate(`/otp?email=${encodeURIComponent(email)}&mode=reset`);
      }, 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-white via-gray-100 to-gray-200 
      dark:from-slate-900 dark:via-slate-800 dark:to-black 
      px-6 py-12 relative"
    >
      {/* ======================= TOP BAR ======================= */}
      <div className="absolute top-5 left-5 right-5 flex justify-between z-20">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg
          bg-white/60 dark:bg-white/10 border border-gray-300/50 dark:border-white/10
          backdrop-blur-md shadow-sm text-gray-800 dark:text-gray-200
          hover:bg-white/80 dark:hover:bg-white/20 transition"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center
          bg-gray-200/80 dark:bg-gray-800/70 border border-gray-300 dark:border-gray-700
          hover:ring-2 hover:ring-emerald-400 dark:hover:ring-teal-400 transition shadow"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Ambient shapes */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-500/20 blur-3xl rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/20 blur-3xl rounded-full" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl p-8 
        rounded-3xl border border-white/20 shadow-2xl"
      >
        <h1 className="text-3xl font-bold text-center 
          bg-gradient-to-r from-emerald-400 to-teal-300 
          bg-clip-text text-transparent">
          Forgot Password
        </h1>

        <p className="text-center text-gray-700 dark:text-gray-300 text-sm mt-1">
          Enter the email linked to your account
        </p>

        <form className="mt-6 space-y-5" onSubmit={submit}>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="Enter your email"
              className={`w-full p-3 pl-10 bg-white/60 dark:bg-white/5 border rounded-lg 
                text-gray-900 dark:text-white outline-none focus:ring-2 transition 
                ${emailValid ? "border-gray-400 dark:border-slate-600 focus:ring-emerald-500" : "border-red-500 focus:ring-red-500"}`}
              value={email}
              onChange={(e) => checkEmailFormat(e.target.value)}
            />

            <Mail className="absolute left-3 top-3 text-slate-500 dark:text-slate-400" size={18} />

            {!emailValid && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Invalid email format
              </p>
            )}
          </div>

          <button
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700
            text-white font-semibold shadow-lg transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
