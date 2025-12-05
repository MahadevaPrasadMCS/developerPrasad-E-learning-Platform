// src/pages/Login.jsx
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, LogIn, CheckCircle2, XCircle, ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext"; // ⬅ ADD THIS

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme(); // ⬅ THEME

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [emailValid, setEmailValid] = useState(true);
  const [loading, setLoading] = useState(false);

  // Email validation
  const handleEmail = (value) => {
    setForm({ ...form, email: value });
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setEmailValid(ok || value === "");
  };

  // Password strength logic
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
    if (passwordStatus.passed < 3)
      return toast.error("Password is too weak.");

    try {
      setLoading(true);
      const res = await api.post("/auth/login", form);

      login(res.data);
      toast.success("Welcome back 🎉");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-white via-gray-100 to-gray-200
      dark:from-slate-900 dark:via-slate-800 dark:to-black
      transition-colors duration-300 relative px-6 py-12 overflow-hidden"
    >

      {/* =====================================================
            TOP BAR: BACK BUTTON (LEFT) + THEME TOGGLE (RIGHT)
         ===================================================== */}
      <div className="
        absolute top-5 left-5 right-5
        flex items-center justify-between
        z-20
      ">
        {/* Back to Home */}
        <button
          onClick={() => navigate("/")}
          className="
            flex items-center gap-2 px-3 py-2 rounded-lg
            bg-white/60 dark:bg-white/10
            border border-gray-300/40 dark:border-white/10
            backdrop-blur-md shadow-sm
            text-gray-800 dark:text-gray-200
            hover:bg-white/80 dark:hover:bg-white/20
            transition
          "
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="
            w-10 h-10 rounded-full flex items-center justify-center
            bg-gray-200/80 dark:bg-gray-800/70
            border border-gray-300 dark:border-gray-700
            hover:ring-2 hover:ring-emerald-400 dark:hover:ring-teal-400
            transition shadow
          "
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Ambient glowing shapes */}
      <div className="absolute top-10 left-10 w-80 h-80 
        bg-emerald-500/20 dark:bg-emerald-600/25 blur-3xl rounded-full transition-all" />
      <div className="absolute bottom-10 right-10 w-96 h-96 
        bg-teal-400/20 dark:bg-teal-500/25 blur-3xl rounded-full transition-all" />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 
        bg-white/70 dark:bg-white/10 
        backdrop-blur-2xl border 
        border-gray-300/40 dark:border-white/20 
        rounded-3xl shadow-2xl transition-colors duration-300"
      >
        <h1 className="text-4xl font-extrabold text-center 
          bg-gradient-to-r from-emerald-600 to-teal-500 
          dark:from-emerald-400 dark:to-teal-300 
          bg-clip-text text-transparent">
          Welcome Back
        </h1>

        <p className="text-center text-gray-600 dark:text-gray-300 text-sm mt-1">
          Your journey continues — let’s grow today ✨
        </p>

        {/* FORM */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => handleEmail(e.target.value)}
              className={`w-full p-3 rounded-lg bg-white/60 dark:bg-white/5 
              border ${
                emailValid ? "border-gray-400 dark:border-slate-600" : "border-red-500"
              }
              text-gray-900 dark:text-white outline-none 
              focus:ring-2 focus:ring-emerald-500 transition`}
              required
            />
            {!emailValid && (
              <p className="text-red-500 text-xs mt-1">Invalid email format</p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full p-3 rounded-lg bg-white/60 dark:bg-white/5 
              border border-gray-400 dark:border-slate-600 text-gray-900 dark:text-white 
              outline-none focus:ring-2 focus:ring-emerald-500 transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-3 text-gray-500 dark:text-gray-400 
              hover:text-emerald-500 transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password Strength */}
          {form.password.length > 0 && (
            <>
              <div className="h-2 bg-gray-300 dark:bg-slate-700 rounded-full overflow-hidden">
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

              <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 dark:text-slate-300">
                {Object.entries(passwordStatus.conditions).map(([key, ok]) => (
                  <div key={key} className="flex items-center gap-1">
                    {ok ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <XCircle size={14} className="text-red-500" />
                    )}
                    <span>
                      {key === "length" && "8–15 characters"}
                      {key === "upper" && "Uppercase letter"}
                      {key === "lower" && "Lowercase letter"}
                      {key === "number" && "Number"}
                      {key === "special" && "Special symbol"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Login Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 
            text-white font-semibold shadow-lg transition disabled:opacity-70 
            flex items-center justify-center gap-2"
          >
            {loading ? "Signing In..." : <><LogIn size={18} /> Sign In</>}
          </motion.button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 flex justify-between items-center px-1">
          <Link
            to="/register"
            className="text-emerald-600 dark:text-emerald-400 
            font-semibold text-sm sm:text-base hover:underline transition"
          >
            Create Account
          </Link>

          <Link
            to="/forgot-password"
            className="text-teal-600 dark:text-teal-300 
            font-semibold text-sm sm:text-base hover:underline transition"
          >
            Forgot Password?
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
