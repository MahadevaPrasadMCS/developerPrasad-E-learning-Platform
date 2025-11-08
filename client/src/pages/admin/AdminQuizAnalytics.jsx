import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { BarChart3, Loader2 } from "lucide-react";

function AdminQuizAnalytics() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Memoized admin headers to ensure stability
  const adminHeaders = useMemo(() => ({ "X-Auth-Role": "admin" }), []);

  // 🧩 Fetch all quizzes (memoized)
  const fetchQuizzes = useCallback(async () => {
    try {
      const res = await api.get("/quiz/list", { headers: adminHeaders });
      setQuizzes(res.data || []);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
    }
  }, [adminHeaders]);

  // 📊 Fetch analytics for selected quiz (memoized)
  const fetchAnalytics = useCallback(async () => {
    if (!selectedQuiz?._id) return;
    setLoading(true);
    try {
      const res = await api.get(`/quiz/${selectedQuiz._id}/analytics`, {
        headers: adminHeaders,
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [selectedQuiz, adminHeaders]);

  // Load quizzes on mount
  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Load analytics when quiz changes
  useEffect(() => {
    if (selectedQuiz?._id) fetchAnalytics();
  }, [selectedQuiz, fetchAnalytics]);

  // 🚫 Restrict non-admins
  if (user?.role !== "admin")
    return (
      <div className="text-center text-red-500 font-semibold mt-10">
        Access denied — Admins only.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-800 py-10 px-6">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="text-teal-500" />
          <h1 className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            Quiz Analytics Dashboard
          </h1>
        </div>

        {/* Quiz selection */}
        <select
          onChange={(e) =>
            setSelectedQuiz(
              quizzes.find((q) => q._id === e.target.value) || null
            )
          }
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 mb-6"
          defaultValue=""
        >
          <option value="" disabled>
            Select a quiz to view analytics
          </option>
          {quizzes.map((quiz) => (
            <option key={quiz._id} value={quiz._id}>
              {quiz.title}
            </option>
          ))}
        </select>

        {/* Loader */}
        {loading && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <Loader2 className="animate-spin inline mr-2" /> Loading analytics...
          </div>
        )}

        {/* Analytics Display */}
        {!loading && analytics && (
          <div className="space-y-6 animate-fade-up">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {selectedQuiz?.title}
            </h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="p-4 bg-teal-100 dark:bg-gray-700 rounded-lg shadow">
                <p className="text-gray-700 dark:text-gray-200 text-sm">
                  Total Attempts
                </p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {analytics.totalAttempts}
                </p>
              </div>

              <div className="p-4 bg-yellow-100 dark:bg-gray-700 rounded-lg shadow">
                <p className="text-gray-700 dark:text-gray-200 text-sm">
                  Average Score
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {analytics.averageScore.toFixed(2)}%
                </p>
              </div>

              <div className="p-4 bg-green-100 dark:bg-gray-700 rounded-lg shadow">
                <p className="text-gray-700 dark:text-gray-200 text-sm">
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analytics.successRate.toFixed(2)}%
                </p>
              </div>
            </div>

            {analytics.topPerformers?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  🏆 Top Performers
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  {analytics.topPerformers.map((p, i) => (
                    <li
                      key={i}
                      className="flex justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"
                    >
                      <span>{p.name}</span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {p.score}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!loading && !analytics && selectedQuiz && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No analytics available for this quiz yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default AdminQuizAnalytics;
