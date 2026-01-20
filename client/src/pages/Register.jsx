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
  const handleEmail = (value) => {
    setForm({ ...form, email: value });
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setEmailValid(ok || value === "");
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
      toast.success("Account created successfully");
      navigate("/login");
    } catch {
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
      bg-gradient-to-br from-white via-gray-100 to-gray-200
      dark:from-slate-900 dark:via-slate-800 dark:to-black
      relative px-6 py-12 transition-colors">

      {/* Top Bar */}
      <div className="absolute top-5 left-5 right-5 flex justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg
          bg-white/60 dark:bg-white/10 border backdrop-blur shadow">
          <ArrowLeft size={18} /> Back
        </button>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center
          bg-gray-200 dark:bg-gray-800 border shadow">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 bg-white/70 dark:bg-white/10
        backdrop-blur-2xl border rounded-3xl shadow-2xl">

        <h1 className="text-3xl font-extrabold text-center
          bg-gradient-to-r from-emerald-600 to-teal-500
          bg-clip-text text-transparent">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

          {/* Name */}
          <input
            required
            placeholder="Full Name"
            className="w-full p-3 rounded-lg border bg-white/60 dark:bg-white/5"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* Email + Verify */}
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => handleEmail(e.target.value)}
              className={`flex-1 p-3 rounded-lg bg-white/60 dark:bg-white/5
              border ${emailValid ? "border-gray-400" : "border-red-500"}`}
              required
            />

            <button
              type="button"
              onClick={sendOtp}
              disabled={!emailValid || !form.email || otpSent || emailVerified}
              className="px-4 rounded-lg bg-emerald-600 text-white
              disabled:opacity-50 transition">
              {emailVerified ? "Verified" : otpSent ? "Sent" : "Verify"}
            </button>
          </div>

          {/* OTP */}
          {otpSent && !emailVerified && (
            <div className="flex gap-2">
              <input
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="flex-1 p-3 rounded-lg border"
              />
              <button
                type="button"
                onClick={verifyOtp}
                className="px-4 bg-emerald-600 text-white rounded-lg">
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
            className="w-full p-3 rounded-lg border"
          />

          {/* Strength */}
          {form.password.length > 0 && (
            <>
              <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${(passwordStatus.passed / 5) * 100}%` }}
                  className={`h-full ${
                    passwordStatus.passed <= 2
                      ? "bg-red-500"
                      : passwordStatus.passed === 3
                      ? "bg-yellow-400"
                      : "bg-emerald-500"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
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
            className="w-full p-3 rounded-lg border"
          />

          <button
            disabled={loading || !emailVerified}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg
            disabled:opacity-60">
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-600 hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
