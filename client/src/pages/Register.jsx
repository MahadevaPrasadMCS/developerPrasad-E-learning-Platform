import React, { useState, useMemo } from "react";
import api from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-hot-toast";

/* -------------------------------------------------
   Toast with sliding close bar
-------------------------------------------------- */
const toastWithBar = (message, type = "success", duration = 4000) => {
  toast.custom(
    () => (
      <div
        className={`relative overflow-hidden rounded-lg px-4 py-3 shadow-lg
        ${type === "error" ? "bg-red-600" : "bg-emerald-600"} text-white`}
      >
        <p className="text-sm font-medium">{message}</p>

        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-white/80"
          style={{
            width: "100%",
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />

        <style>
          {`
            @keyframes shrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}
        </style>
      </div>
    ),
    { duration }
  );
};

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
  const [loading, setLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(true);

  /* -------------------------------------------------
     Email validation
  -------------------------------------------------- */
  const handleEmail = (value) => {
    setForm({ ...form, email: value });
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setEmailValid(ok || value === "");
  };

  /* -------------------------------------------------
     Password validation
  -------------------------------------------------- */
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

  /* -------------------------------------------------
     Send OTP
  -------------------------------------------------- */
  const sendOtp = async () => {
    if (!emailValid)
      return toastWithBar("Invalid email format", "error");

    try {
      await api.post("/auth/send-otp", {
        email: form.email,
        purpose: "REGISTER",
      });
      setOtpSent(true);
      toastWithBar("OTP sent to your email");
    } catch (err) {
      toastWithBar(
        err.response?.data?.message || "Failed to send OTP",
        "error"
      );
    }
  };

  /* -------------------------------------------------
     Verify OTP
  -------------------------------------------------- */
  const verifyOtp = async () => {
    if (!otp) return toastWithBar("Enter OTP", "error");

    try {
      await api.post("/auth/verify-otp", {
        email: form.email,
        otp,
        purpose: "REGISTER",
      });
      setEmailVerified(true);
      toastWithBar("Email verified successfully");
    } catch (err) {
      toastWithBar(
        err.response?.data?.message || "Invalid or expired OTP",
        "error"
      );
    }
  };

  /* -------------------------------------------------
     Submit Registration
  -------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailVerified)
      return toastWithBar("Verify email before registering", "error");

    if (form.password !== form.confirmPassword)
      return toastWithBar("Passwords do not match", "error");

    if (passwordStatus.passed !== passwordStatus.total)
      return toastWithBar("Password does not meet requirements", "error");

    try {
      setLoading(true);
      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      toastWithBar("Account created successfully");
      navigate("/login");
    } catch (err) {
      toastWithBar(
        err.response?.data?.message || "Registration failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
      bg-gradient-to-br from-white via-gray-100 to-gray-200
      dark:from-slate-900 dark:via-slate-800 dark:to-black
      relative px-6 py-12 transition-colors"
    >
      {/* Top bar */}
      <div className="absolute top-5 left-5 right-5 flex justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg
          bg-white/60 dark:bg-white/10 border backdrop-blur shadow"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back</span>
        </button>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center
          bg-gray-200 dark:bg-gray-800 border shadow"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 bg-white/70 dark:bg-white/10
        backdrop-blur border rounded-3xl shadow-2xl"
      >
        <h1 className="text-3xl font-extrabold text-center
          bg-gradient-to-r from-emerald-600 to-teal-500
          bg-clip-text text-transparent">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Name */}
          <input
            type="text"
            required
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-3 rounded-lg border"
          />

          {/* Email */}
          <div>
            <input
              type="email"
              required
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => handleEmail(e.target.value)}
              className="w-full p-3 rounded-lg border"
            />
            <button
              type="button"
              onClick={sendOtp}
              disabled={otpSent || emailVerified}
              className="mt-2 text-xs text-emerald-600 hover:underline"
            >
              {emailVerified
                ? "Email Verified"
                : otpSent
                ? "OTP Sent"
                : "Verify Email"}
            </button>
          </div>

          {/* OTP */}
          {otpSent && !emailVerified && (
            <>
              <input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 rounded-lg border"
              />
              <button
                type="button"
                onClick={verifyOtp}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg"
              >
                Verify OTP
              </button>
            </>
          )}

          {/* Passwords */}
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="w-full p-3 rounded-lg border"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            className="w-full p-3 rounded-lg border"
          />

          {/* Password checklist */}
          <div className="grid grid-cols-2 text-xs gap-1">
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

          <button
            disabled={loading || !emailVerified}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg
            disabled:opacity-60"
          >
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
