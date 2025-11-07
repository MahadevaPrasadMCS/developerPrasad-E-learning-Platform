import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { user, logout, handleAuthError } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🚫 Handle blocked users (auto logout)
  useEffect(() => {
    if (user?.isBlocked) {
      logout("🚫 Your account is blocked. Contact admin.");
      navigate("/login");
    }
  }, [user, logout, navigate]);

  // 📢 Fetch Announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get("/announcements");
        setAnnouncements(res.data);
      } catch (err) {
        console.error("Error loading announcements", err);
        handleAuthError(err.response?.status, err.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, [handleAuthError]);

  if (!user)
    return (
      <p className="text-center mt-10 text-red-500 dark:text-red-400">
        Please log in to view your dashboard.
      </p>
    );

  if (user.isBlocked)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 rounded-2xl shadow-lg backdrop-blur-md">
          <h2 className="text-3xl font-bold mb-2">🚫 Account Blocked</h2>
          <p>Please contact admin to reactivate your account.</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 transition-all duration-300">
        {/* 🌟 Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-teal-600 dark:text-teal-400 mb-2 drop-shadow-sm">
            Welcome, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Glad to have you back on{" "}
            <span className="font-semibold text-teal-500 dark:text-teal-400">
              YouLearnHub
            </span>
            !
          </p>
        </div>

        {/* 💎 Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="p-6 bg-gradient-to-r from-teal-100 to-teal-50 dark:from-teal-900/50 dark:to-teal-800/30 rounded-2xl shadow-md text-center transform hover:scale-[1.03] transition-transform duration-300">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              Role
            </p>
            <h2 className="text-2xl font-bold text-teal-700 dark:text-teal-300 capitalize mt-1">
              {user.role}
            </h2>
          </div>

          <div className="p-6 bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-800/20 rounded-2xl shadow-md text-center transform hover:scale-[1.03] transition-transform duration-300">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              Total Coins
            </p>
            <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
              💰 {user.coins}
            </h2>
          </div>
        </div>

        {/* 📢 Announcements */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            📣 Latest Announcements
          </h2>

          {loading ? (
            <p className="text-gray-500 text-center dark:text-gray-400">
              Loading announcements...
            </p>
          ) : announcements.length === 0 ? (
            <p className="text-gray-500 text-center dark:text-gray-400">
              No announcements yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {announcements.map((a) => (
                <li
                  key={a._id}
                  className="p-5 bg-gray-50 dark:bg-gray-700/60 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                    {a.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                    {a.message || a.description}
                  </p>

                  {/* Optional links */}
                  {a.links && a.links.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        🔗 Related Links:
                      </p>
                      <ul className="list-disc list-inside text-sm text-teal-600 dark:text-teal-400">
                        {a.links.map((link, i) => (
                          <li key={i}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ⚡ Quick Actions */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100">
            🎯 Quick Actions
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: "🧠 Take Quiz", to: "/quiz", color: "teal" },
              { label: "📘 Learn", to: "/learn", color: "indigo" },
              { label: "💳 Wallet", to: "/wallet", color: "yellow" },
              { label: "🏪 Store", to: "/store", color: "purple" },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={() => navigate(btn.to)}
                className={`px-6 py-2 bg-${btn.color}-600 hover:bg-${btn.color}-700 text-white rounded-lg font-medium shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
