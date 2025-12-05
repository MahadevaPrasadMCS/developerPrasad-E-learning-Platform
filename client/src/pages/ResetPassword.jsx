// src/pages/ResetPassword.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleTheme } = useTheme();

  const token = new URLSearchParams(location.search).get("token");
  const email = new URLSearchParams(location.search).get("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or expired reset link");
      setTimeout(() => navigate("/forgot-password"), 2000);
    }
  }, [token, navigate]);

  const status = useMemo(() => {
    const c = {
      length: password.length >= 8 && password.length <= 15,
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };
    const passed = Object.values(c).filter(Boolean).length;
    return { c, passed, total: 4 };
  }, [password]);

  const reset = async (e) => {
    e.preventDefault();

    if (password !== confirm) return toast.error("Passwords do not match");
    if (status.passed < 3) return toast.error("Password too weak");

    try {
      setLoading(true);

      await api.post("/auth/reset-password", { token, password });
      toast.success("Password updated!");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-white via-gray-100 to-gray-200 
      dark:from-black dark:via-slate-900 dark:to-black px-6 py-12 relative">

      {/* ======================= TOP BAR ======================= */}
      <div className="absolute top-5 left-5 right-5 flex justify-between z-20">

        {/* Back */}
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

      {/* Glow background */}
      <div className="absolute inset-0 pointer-events-none opacity-80">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-teal-500/20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/20 blur-3xl rounded-full" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md p-8 rounded-3xl backdrop-blur-2xl
        bg-white/10 dark:bg-white/5 border border-white/20 shadow-2xl"
      >
        <h1 className="text-3xl font-bold text-center 
          bg-gradient-to-r from-emerald-400 to-teal-300 
          bg-clip-text text-transparent">
          Reset Password
        </h1>

        {/* Show email */}
        <p className="text-center text-gray-700 dark:text-gray-300 text-sm mt-2">
          Resetting password for:
        </p>
        <div className="mt-2 p-3 text-center bg-white/5 border border-gray-600 rounded-lg 
          text-teal-400 text-sm select-none">
          {email}
        </div>

        <form className="mt-8 space-y-6" onSubmit={reset}>
          {/* New Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-white/60 dark:bg-white/5 border border-gray-400 dark:border-slate-600 
                rounded-lg text-gray-900 dark:text-white outline-none focus:ring-2 
                focus:ring-emerald-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-3 text-gray-500 dark:text-gray-400 hover:text-teal-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm */}
          <div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full p-3 bg-white/60 dark:bg-white/5 border border-gray-400 dark:border-slate-600 
                rounded-lg text-gray-900 dark:text-white outline-none focus:ring-2 
                focus:ring-teal-500 transition"
            />
          </div>

          {/* Strength Bar */}
          {password.length > 0 && (
            <>
              <div className="h-2 bg-gray-300 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${(status.passed / status.total) * 100}%` }}
                  className={`h-full rounded-full ${
                    status.passed <= 1
                      ? "bg-red-500"
                      : status.passed === 2
                      ? "bg-yellow-400"
                      : "bg-emerald-500"
                  }`}
                />
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-slate-300 mt-2">
                {[
                  ["length", "8–15 characters"],
                  ["upper", "Uppercase letter"],
                  ["number", "Number"],
                  ["special", "Special symbol"],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1">
                    {status.c[key] ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <XCircle size={14} className="text-red-400" />
                    )}
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 
            text-white font-semibold shadow-lg transition"
          >
            {loading ? "Updating..." : "Reset Password"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
