import React, { useState, useMemo } from "react";
import api from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Sun,
  Moon,
  UserPlus,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [loading, setLoading] = useState(false);

  /* Email validation */
  const commonDomains = ["gmail.com", "yahoo.com", "outlook.com"];

  const handleEmail = (value) => {
    setForm({ ...form, email: value });

    // basic email format validation
    const basicOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!basicOk) {
      setEmailValid(false);
      return;
    }

    const domain = value.split("@")[1]?.toLowerCase();

    // ❌ domain not allowed
    if (!commonDomains.includes(domain)) {
      toast.error("Please use Gmail, Yahoo, or Outlook email");
      setEmailValid(false);
      return;
    }

    // ✅ valid email
    setEmailValid(true);
  };

  /* Password strength */
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

  const sendOtp = async () => {
    try {
      await api.post("/auth/send-otp", {
        email: form.email,
        purpose: "REGISTER",
      });
      setOtpSent(true);
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const verifyOtp = async () => {
    try {
      await api.post("/auth/verify-otp", {
        email: form.email,
        otp,
        purpose: "REGISTER",
      });
      setEmailVerified(true);
      toast.success("Email verified");
    } catch {
      toast.error("Invalid or expired OTP");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailVerified)
      return toast.error("Verify email before registering");

    if (form.password !== form.confirmPassword)
      return toast.error("Passwords do not match");

    if (passwordStatus.passed !== passwordStatus.total)
      return toast.error("Password does not meet requirements");

    try {
      setLoading(true);
      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      toast.success("Account created successfully 🎉");
      navigate("/login");
    } catch {
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-start sm:items-center justify-center 
      bg-gradient-to-br from-white via-gray-100 to-gray-200
      dark:from-slate-900 dark:via-slate-800 dark:to-black
      transition-colors duration-300 relative px-6 pt-24 sm:pt-12 pb-12 overflow-hidden"
    >
      {/* Top Bar */}
      <div className="absolute top-4 sm:top-5 left-4 sm:left-5 right-4 sm:right-5 flex justify-between z-20">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg
          bg-white/60 dark:bg-white/10
          border border-gray-300/40 dark:border-white/10
          backdrop-blur-md shadow-sm
          hover:bg-white/80 dark:hover:bg-white/20 transition"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center
          bg-gray-200/80 dark:bg-gray-800/70
          border border-gray-300 dark:border-gray-700
          hover:ring-2 hover:ring-emerald-400 transition shadow"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Ambient glows */}
      <div className="absolute top-10 left-10 w-80 h-80 
        bg-emerald-500/20 dark:bg-emerald-600/25 blur-3xl rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 
        bg-teal-400/20 dark:bg-teal-500/25 blur-3xl rounded-full" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-6 sm:p-8 
        bg-white/70 dark:bg-white/10 
        backdrop-blur-2xl border 
        border-gray-300/40 dark:border-white/20 
        rounded-3xl shadow-2xl"
      >
        <h1 className="text-4xl font-extrabold text-center 
          bg-gradient-to-r from-emerald-600 to-teal-500 
          dark:from-emerald-400 dark:to-teal-300 
          bg-clip-text text-transparent">
          Create Account
        </h1>

        <p className="text-center text-gray-600 dark:text-gray-300 text-sm mt-1">
          Start your journey — let’s build together ✨
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Name */}
          <input
            required
            placeholder="Full Name"
            className="w-full p-3 rounded-lg bg-white/60 dark:bg-white/5
            border border-gray-400 dark:border-slate-600
            outline-none focus:ring-2 focus:ring-emerald-500 transition"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* Email + OTP */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => handleEmail(e.target.value)}
              className={`flex-1 p-3 rounded-lg bg-white/60 dark:bg-white/5
              border ${
                emailValid
                  ? "border-gray-400 dark:border-slate-600"
                  : "border-red-500"
              }
              outline-none focus:ring-2 focus:ring-emerald-500 transition`}
              required
            />

            <button
              type="button"
              onClick={sendOtp}
              disabled={!emailValid || !form.email || otpSent || emailVerified}
              className="px-4 sm:px-4 py-3 sm:py-0 rounded-lg bg-emerald-600 text-white
              hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {emailVerified ? "Verified" : otpSent ? "Sent" : "Verify"}
            </button>
          </div>

          {otpSent && !emailVerified && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="flex-1 p-3 rounded-lg bg-white/60 dark:bg-white/5
                border border-gray-400 dark:border-slate-600
                outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              <button
                type="button"
                onClick={verifyOtp}
                className="w-full sm:w-auto px-4 py-3 sm:py-0 bg-emerald-600 hover:bg-emerald-700
                text-white rounded-lg transition"
              >
                Verify
              </button>
            </div>
          )}

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="w-full p-3 rounded-lg bg-white/60 dark:bg-white/5
            border border-gray-400 dark:border-slate-600
            outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />

          {/* Strength */}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-600 dark:text-slate-300">
                {Object.entries(passwordStatus.conditions).map(([k, ok]) => (
                  <div key={k} className="flex items-center gap-1">
                    {ok ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <XCircle size={14} className="text-red-500" />
                    )}
                    <span>{k}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            className="w-full p-3 rounded-lg bg-white/60 dark:bg-white/5
            border border-gray-400 dark:border-slate-600
            outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading || !emailVerified}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700
            text-white font-semibold shadow-lg transition disabled:opacity-60
            flex items-center justify-center gap-2"
          >
            {loading ? "Creating..." : <><UserPlus size={18} /> Create Account</>}
          </motion.button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-600 hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
