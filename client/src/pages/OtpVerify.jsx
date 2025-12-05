// src/pages/OtpVerify.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { KeyRound, ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleTheme } = useTheme();

  const params = new URLSearchParams(location.search);
  const email = params.get("email");
  const mode = params.get("mode");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("Email missing.");
      setTimeout(() => navigate("/forgot-password"), 2000);
    }
  }, [email, navigate]);

  const submitOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) return toast.error("Enter a valid 6-digit OTP");

    try {
      setLoading(true);

      const res = await api.post("/auth/verify-otp", { otp, email });

      toast.success("OTP verified!");

      if (mode === "reset" && res.data.resetToken) {
        navigate(
          `/reset-password?email=${encodeURIComponent(email)}&token=${res.data.resetToken}`
        );
        return;
      }

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setResending(true);
      await api.post("/auth/send-otp", {
        email,
        purpose: mode === "reset" ? "RESET_PASSWORD" : "VERIFY_ACCOUNT",
      });
      toast.success("New OTP sent");
    } catch (err) {
      toast.error("Failed to resend");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-white via-gray-100 to-gray-200
      dark:from-black dark:via-slate-900 dark:to-black px-6 py-12 relative">

      {/* ======================= TOP BAR ======================= */}
      <div className="absolute top-5 left-5 right-5 flex justify-between z-20">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg
          bg-white/60 dark:bg-white/10 border border-gray-300/50 dark:border-white/10
          backdrop-blur-md shadow-sm text-gray-900 dark:text-gray-200
          hover:bg-white/80 dark:hover:bg-white/20 transition"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center
          bg-gray-200/80 dark:bg-gray-800/70 border border-gray-300 dark:border-gray-700
          hover:ring-2 hover:ring-emerald-400 dark:hover:ring-teal-400 transition shadow"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-500/20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500/20 blur-3xl rounded-full" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md p-8 rounded-3xl backdrop-blur-2xl
          bg-white/10 dark:bg-white/5 border border-white/20 shadow-2xl"
      >
        <div className="flex justify-center mb-2">
          <KeyRound className="text-teal-300" size={32} />
        </div>

        <h1 className="text-3xl font-bold text-center 
          bg-gradient-to-r from-emerald-400 to-teal-300 
          bg-clip-text text-transparent">
          Verify OTP
        </h1>

        <p className="text-center text-gray-700 dark:text-gray-300 text-sm mt-2">
          Enter the 6-digit code sent to  
          <span className="text-teal-400 ml-1">{email}</span>
        </p>

        <form className="mt-8 space-y-6" onSubmit={submitOtp}>
          <input
            type="text"
            maxLength="6"
            required
            placeholder="000000"
            className="w-full p-3 bg-white/60 dark:bg-white/5 border border-gray-400 dark:border-slate-600 
              rounded-lg text-gray-900 dark:text-white text-center tracking-[0.4em] text-lg 
              outline-none focus:ring-2 focus:ring-emerald-500 transition"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full py-3 rounded-lg 
            bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </motion.button>
        </form>

        {/* Resend */}
        <div className="text-center mt-4">
          <button
            onClick={resendOtp}
            disabled={resending}
            className="text-teal-400 text-sm hover:underline disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend OTP"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
