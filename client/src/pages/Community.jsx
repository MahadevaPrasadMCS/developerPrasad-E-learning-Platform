import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Community() {
  const { token, user, handleAuthError } = useAuth();
  const [threads, setThreads] = useState([]);
  const [newThread, setNewThread] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Fetch Threads
  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await api.get("/community");
      setThreads(res.data || []);
    } catch (err) {
      console.error("Error fetching community threads:", err);
      handleAuthError(err.response?.status, err.response?.data?.message);
      setError("Failed to load discussions. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✉️ Post new thread
  const handlePost = async () => {
    if (!token) return alert("Please log in to post in the community!");
    if (!newThread.trim()) return alert("Write something before posting!");
    try {
      setPosting(true);
      await api.post(
        "/community",
        { message: newThread },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewThread("");
      fetchThreads();
    } catch (err) {
      console.error("Post failed:", err);
      handleAuthError(err.response?.status, err.response?.data?.message);
      setError("Failed to post message. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 py-12 px-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* 🏷️ Header */}
        <h2 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-8 drop-shadow-sm">
          💬 Community Discussion
        </h2>

        {/* 🧠 New Thread */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-lg mb-10 border border-gray-200 dark:border-gray-700 transition-all">
          {token ? (
            <>
              <textarea
                className="w-full p-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
                rows="3"
                placeholder="Share your thoughts with the community..."
                value={newThread}
                onChange={(e) => setNewThread(e.target.value)}
              />
              <button
                onClick={handlePost}
                disabled={posting}
                className={`mt-4 px-6 py-2 rounded-lg font-medium shadow-md text-white transition-all duration-300 ${
                  posting
                    ? "bg-teal-400 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700 hover:scale-[1.03]"
                }`}
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </>
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <p>🔒 Please log in to post messages in the community.</p>
            </div>
          )}
        </div>

        {/* 🌀 Loading / Error / Empty States */}
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 animate-pulse">
            Loading discussions...
          </p>
        ) : error ? (
          <div className="text-center bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 py-4 px-6 rounded-lg shadow-sm">
            {error}
          </div>
        ) : threads.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 italic">
            No discussions yet. Be the first to start a conversation!
          </p>
        ) : (
          <div className="space-y-5">
            {threads.map((t) => (
              <div
                key={t._id}
                className="group p-5 bg-white/80 dark:bg-gray-800/90 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-teal-600 dark:text-teal-400">
                    {t.user?.name || "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(t.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {t.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Community;
