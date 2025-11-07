import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Learn() {
  const { token, handleAuthError } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchPurchases = async () => {
      try {
        const res = await api.get("/store/my-purchases", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPurchases(res.data || []);
      } catch (err) {
        console.error("Error fetching purchases:", err);
        handleAuthError(err.response?.status, err.response?.data?.message);
        setError("Failed to load your purchased resources.");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [token, handleAuthError]);

  if (!token)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600 dark:text-gray-300 px-6 text-center">
        <h2 className="text-2xl font-semibold mb-3">🔒 Access Restricted</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Please log in to view your purchased learning materials.
        </p>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-500 dark:text-gray-400 animate-pulse">
        Loading your resources...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 py-5 px-8 rounded-xl shadow-md text-center">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-extrabold text-center mb-10 text-teal-600 dark:text-teal-400 drop-shadow-sm">
          My Learning Resources 📘
        </h2>

        {purchases.length === 0 ? (
          <div className="text-center py-16 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg backdrop-blur-md animate-fade-in">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              You haven’t unlocked any content yet.
            </p>
            <a
              href="/store"
              className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              Visit Store 🛍️
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {purchases.map((p, index) => (
              <div
                key={p._id}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {p.title}
                  </h3>
                  <span
                    className={`text-sm px-2 py-1 rounded-md font-medium ${
                      p.type === "video"
                        ? "bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300"
                        : "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                    }`}
                  >
                    {p.type === "video" ? "🎥 Video" : "📘 Notes"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  Access your resource anytime and boost your preparation.
                </p>

                <button
                  onClick={() => {
                    const baseURL =
                      window.location.hostname === "localhost"
                        ? "http://localhost:5000"
                        : "https://youlearnhub-backend.onrender.com";
                    window.open(
                      `${baseURL}/api/store/download/${p.fileName}?token=${token}`,
                      "_blank"
                    );
                  }}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Download Resource
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Learn;
