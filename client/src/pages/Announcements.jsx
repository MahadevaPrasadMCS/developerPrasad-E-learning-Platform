import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Announcements() {
  const { handleAuthError } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Fetch Announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get("/announcements");
        setAnnouncements(res.data || []);
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
        setError("Failed to load announcements. Please try again later.");
        handleAuthError(err.response?.status, err.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, [handleAuthError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* 🏷️ Header */}
        <h2 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-8 drop-shadow-sm">
          📢 Announcements
        </h2>

        {/* 🌀 Loader / Error */}
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 animate-pulse">
            Loading announcements...
          </p>
        ) : error ? (
          <div className="text-center bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 py-4 px-6 rounded-lg shadow-sm">
            {error}
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            No announcements yet.
          </p>
        ) : (
          <div className="space-y-6">
            {announcements.map((a) => (
              <div
                key={a._id}
                className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 hover:-translate-y-1"
              >
                {/* 🧩 Title + Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                  <h3 className="text-2xl font-semibold text-teal-600 dark:text-teal-400 group-hover:text-teal-500 dark:group-hover:text-teal-300 transition-colors duration-200">
                    {a.title || "Untitled Announcement"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                    {a.createdAt
                      ? new Date(a.createdAt).toLocaleDateString()
                      : "Unknown date"}
                  </p>
                </div>

                {/* 📝 Description */}
                {a.description && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 whitespace-pre-line">
                    {a.description}
                  </p>
                )}

                {/* 🔗 Links */}
                {a.links?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300">
                      🔗 Related Links:
                    </h5>
                    <ul className="list-disc list-inside text-blue-600 dark:text-blue-400">
                      {a.links.map((link, i) => (
                        <li key={i}>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline break-all"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 🌟 Special Highlights */}
                {a.specialThings && a.specialThings.trim() !== "" && (
                  <div className="mt-4 bg-gradient-to-r from-teal-50 to-white dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg border-l-4 border-teal-500">
                    <h5 className="font-semibold text-teal-700 dark:text-teal-300 mb-1">
                      🌟 Special Highlights
                    </h5>
                    <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">
                      {a.specialThings}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Announcements;
