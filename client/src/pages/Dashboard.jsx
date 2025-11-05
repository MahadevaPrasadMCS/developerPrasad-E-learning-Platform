import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle blocked users
  useEffect(() => {
    if (user?.isBlocked) {
      logout();
      navigate("/login");
    }
  }, [user, logout, navigate]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get("/announcements");
        setAnnouncements(res.data);
      } catch (err) {
        console.error("Error loading announcements", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (!user)
    return (
      <p className="text-center mt-10 text-red-500">
        Please log in to view your dashboard.
      </p>
    );

  if (user.isBlocked)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-2">🚫 Account Blocked</h2>
          <p>Please contact admin to reactivate your account.</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 transition-all duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-600 dark:text-teal-400 mb-2">
            Welcome, {user.name} 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Glad to have you back on{" "}
            <span className="font-semibold text-teal-500">YouLearnHub</span>!
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="p-6 bg-teal-100 dark:bg-teal-900/50 rounded-xl shadow-sm text-center transform hover:scale-105 transition-transform duration-300">
            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              Role
            </p>
            <h2 className="text-2xl font-bold text-teal-700 dark:text-teal-300 capitalize mt-1">
              {user.role}
            </h2>
          </div>

          <div className="p-6 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl shadow-sm text-center transform hover:scale-105 transition-transform duration-300">
            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              Total Coins
            </p>
            <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
              💰 {user.coins}
            </h2>
          </div>
        </div>

        {/* Announcements */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2">
            📢 <span>Latest Announcements</span>
          </h2>

          {loading ? (
            <p className="text-gray-500 text-center">Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <p className="text-gray-500 text-center">No announcements yet.</p>
          ) : (
            <ul className="space-y-4">
              {announcements.map((a) => (
                <li
                  key={a._id}
                  className="p-5 bg-gray-100 dark:bg-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                    {a.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    {a.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            🎯 Quick Actions
          </h2>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/quiz")}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              🧠 Take Quiz
            </button>
            <button
              onClick={() => navigate("/learn")}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              📘 Learn
            </button>
            <button
              onClick={() => navigate("/wallet")}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              💳 Wallet
            </button>
            <button
              onClick={() => navigate("/store")}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              🏪 Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
