// src/pages/Register.jsx
import React, { useState, useMemo } from "react";
import api from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { CheckCircle2, XCircle, ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext"; // THEME SUPPORT

export default function Register() {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme(); // GET THEME CONTEXT

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(true);

  // Email validation
  const handleEmail = (value) => {
    setForm({ ...form, email: value });
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setEmailValid(ok || value === "");
  };

  // Password validation logic
  const passwordStatus = useMemo(() => {
    const pass = form.password;
    const conditions = {
      length: pass.length >= 8 && pass.length <= 15,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /\d/.test(pass),
      special: /[@$!%*?&]/.test(pass),
    };
    const passed = Object.values(conditions).filter(Boolean).length;

    return { conditions, passed, total: 5 };
  }, [form.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailValid) return toast.error("Invalid email format.");
    if (passwordStatus.passed !== passwordStatus.total)
      return toast.error("Complete all password requirements.");

    try {
      setLoading(true);
      await api.post("/auth/register", form);

      toast.success("Account created! Verify your email.");
      navigate("/otp");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-white via-gray-100 to-gray-200 
      dark:from-slate-900 dark:via-slate-800 dark:to-black
      relative px-6 py-12 transition-colors"
    >

      {/* =====================================================
            TOP BAR: BACK BUTTON + THEME TOGGLE
      ===================================================== */}
      <div className="absolute top-5 left-5 right-5 z-20 flex items-center justify-between">

        {/* Back to Home */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg
            bg-white/60 dark:bg-white/10
            border border-gray-300/50 dark:border-white/10
            backdrop-blur-md shadow-sm
            text-gray-900 dark:text-gray-200
            hover:bg-white/80 dark:hover:bg-white/20
            transition"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center
            bg-gray-200/80 dark:bg-gray-800/70
            border border-gray-300 dark:border-gray-700
            hover:ring-2 hover:ring-emerald-400 dark:hover:ring-teal-400
            transition shadow"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Ambient glowing shapes */}
      <div className="absolute w-80 h-80 rounded-full bg-emerald-600/20 dark:bg-emerald-500/25 blur-3xl top-10 left-10" />
      <div className="absolute w-96 h-96 rounded-full bg-teal-500/20 dark:bg-teal-400/25 blur-3xl bottom-10 right-10" />

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 
        bg-white/70 dark:bg-white/10 
        backdrop-blur-2xl border 
        border-gray-300/40 dark:border-white/20 
        rounded-3xl shadow-2xl transition"
      >
        <h1 className="text-3xl font-extrabold text-center 
          bg-gradient-to-r from-emerald-600 to-teal-500 
          dark:from-emerald-400 dark:to-teal-300 
          bg-clip-text text-transparent">
          Create Account
        </h1>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>

          {/* Name */}
          <div>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 rounded-lg bg-white/60 dark:bg-white/5 
              border border-gray-400 dark:border-slate-600 
              text-gray-900 dark:text-white 
              focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              required
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => handleEmail(e.target.value)}
              className={`w-full p-3 rounded-lg bg-white/60 dark:bg-white/5 
              border ${
                emailValid ? "border-gray-400 dark:border-slate-600" : "border-red-500"
              }
              text-gray-900 dark:text-white 
              focus:ring-2 focus:ring-emerald-500 outline-none`}
            />
            {!emailValid && (
              <p className="text-red-500 text-xs mt-1">Invalid email format</p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              required
              placeholder="Create Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full p-3 rounded-lg bg-white/60 dark:bg-white/5 
              border border-gray-400 dark:border-slate-600 
              text-gray-900 dark:text-white 
              focus:ring-2 focus:ring-emerald-500 outline-none"
            />

            {/* Strength Meter */}
            <div className="h-2 bg-gray-300 dark:bg-slate-700 mt-2 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${(passwordStatus.passed / 5) * 100}%` }}
                className={`h-full rounded-full ${
                  passwordStatus.passed <= 2
                    ? "bg-red-500"
                    : passwordStatus.passed === 3
                    ? "bg-yellow-400"
                    : "bg-emerald-500"
                }`}
              />
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 text-xs mt-2 gap-1 text-gray-700 dark:text-slate-300">
              {Object.entries(passwordStatus.conditions).map(([k, ok]) => (
                <div key={k} className="flex items-center gap-1">
                  {ok ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : (
                    <XCircle size={14} className="text-red-400" />
                  )}
                  <span>
                    {k === "length" && "8–15 characters"}
                    {k === "upper" && "Uppercase letter"}
                    {k === "lower" && "Lowercase letter"}
                    {k === "number" && "Number"}
                    {k === "special" && "Special character"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            disabled={loading}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 
            text-white font-semibold shadow-lg transition disabled:opacity-70"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs mt-6 text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-medium">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
