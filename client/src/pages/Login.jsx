import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        email: String(formData.email).trim(),
        password: String(formData.password).trim(),
      };

      const res = await api.post("/auth/login", payload);
      const { token, user } = res.data;

      if (user.isBlocked) {
        setMessage("🚫 Account blocked. Contact admin.");
        setLoading(false);
        return;
      }

      login(user, token);
      navigate(user.role === "admin" ? "/admin/manage-quiz" : "/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      const msg =
        err.response?.data?.message ||
        "❌ Login failed. Please check your credentials.";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-md p-8 transition-all duration-500">
        {/* Decorative orb */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-300/30 dark:bg-teal-600/20 blur-3xl rounded-full pointer-events-none"></div>

        {/* Title */}
        <h2 className="text-3xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-2 tracking-tight">
          Welcome Back 👋
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6 text-sm">
          Log in to continue your learning journey
        </p>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 animate-fade-in"
          autoComplete="off"
        >
          <div>
            <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none dark:bg-gray-700 dark:text-gray-100 transition"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none dark:bg-gray-700 dark:text-gray-100 transition"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 font-semibold rounded-lg text-white shadow-md transition-all duration-300 ${
              loading
                ? "bg-teal-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700 hover:shadow-lg hover:scale-[1.02]"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Feedback Message */}
        {message && (
          <p
            className={`text-center mt-4 font-medium ${
              message.includes("🚫") || message.includes("❌")
                ? "text-red-500"
                : "text-green-500"
            }`}
          >
            {message}
          </p>
        )}

        {/* Register Link */}
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Don’t have an account?{" "}
          <span
            className="text-teal-600 dark:text-teal-400 font-semibold hover:underline cursor-pointer"
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
