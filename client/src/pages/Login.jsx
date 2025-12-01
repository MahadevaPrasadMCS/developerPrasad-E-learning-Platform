// src/pages/Login.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      login(res.data);
      toast.success("Welcome back! 🚀");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
    bg-gradient-to-br from-emerald-400/20 via-teal-600/20 to-slate-900/30 
    dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-6 py-12">

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl shadow-2xl 
        bg-white/90 dark:bg-slate-900/90 
        backdrop-blur-xl border border-white/30 dark:border-slate-700"
      >
        <h1 className="text-3xl font-bold text-center 
        bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
          YouLearnHub
        </h1>
        <p className="text-center text-sm text-slate-500 dark:text-slate-300 mt-1">
          Continue learning, continue growing ✨
        </p>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="relative">
            <input
              type="email"
              className="peer w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 
              dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white 
              placeholder-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition"
              placeholder="Email"
              required
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value.trim().toLowerCase() })
              }
            />
            <label className="absolute left-3 top-3 text-xs text-slate-500 dark:text-slate-400 
            transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
            peer-focus:top-0 peer-focus:text-emerald-500 peer-focus:text-xs">
              Email Address
            </label>
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="peer w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 
              dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white 
              placeholder-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition"
              placeholder="Password"
              required
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
            <label className="absolute left-3 top-3 text-xs text-slate-500 dark:text-slate-400
            transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
            peer-focus:top-0 peer-focus:text-emerald-500 peer-focus:text-xs">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-3 text-slate-400 hover:text-emerald-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Login Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg flex items-center justify-center gap-2
            bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold 
            shadow-lg shadow-emerald-500/30 transition disabled:opacity-70"
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </motion.button>
        </form>

        {/* Register link */}
        <p className="text-xs text-center mt-5 text-slate-500 dark:text-slate-400">
          New to learning?{" "}
          <Link to="/register" className="text-emerald-600 font-medium hover:underline">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
