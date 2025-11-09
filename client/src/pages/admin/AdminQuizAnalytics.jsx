import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { BarChart3, Loader2, User } from "lucide-react";

function AdminQuizAnalytics() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const adminHeaders = useMemo(() => ({ "X-Auth-Role": "admin" }), []);

  const fetchQuizzes = useCallback(async () => {
    try {
      const res = await api.get("/quiz/list", { headers: adminHeaders });
      setQuizzes(res.data || []);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
    }
  }, [adminHeaders]);

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

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  useEffect(() => {
    if (selectedQuiz?._id) fetchAnalytics();
  }, [selectedQuiz, fetchAnalytics]);

  if (user?.role !== "admin")
    return (
      <div className="text-center text-red-500 font-semibold mt-10">
        Access denied — Admins only.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-800 py-6 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-10 transition-all">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <BarChart3 className="text-teal-500 w-6 h-6 sm:w-7 sm:h-7" />
          <h1 className="text-xl sm:text-2xl font-bold text-teal-600 dark:text-teal-400">
            Quiz Analytics Dashboard
          </h1>
        </div>

        {/* Quiz Selector */}
        <select
          onChange={(e) =>
            setSelectedQuiz(
              quizzes.find((q) => q._id === e.target.value) || null
            )
          }
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 mb-6 text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
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

        {/* Loading */}
        {loading && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            <Loader2 className="animate-spin inline mr-2" /> Loading analytics...
          </div>
        )}

        {/* Analytics Display */}
        {!loading && analytics && (
          <div className="space-y-8 animate-fade-up">
            {/* Summary */}
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                {selectedQuiz?.title}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-4 sm:p-5 bg-teal-100 dark:bg-gray-700 rounded-lg shadow-md text-center">
                  <p className="text-gray-700 dark:text-gray-200 text-sm sm:text-base">
                    Total Participants
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-teal-600 dark:text-teal-400">
                    {analytics.totalUsers}
                  </p>
                </div>

                <div className="p-4 sm:p-5 bg-yellow-100 dark:bg-gray-700 rounded-lg shadow-md text-center">
                  <p className="text-gray-700 dark:text-gray-200 text-sm sm:text-base">
                    Average Score (All Users)
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {analytics.averageScore?.toFixed(2)}%
                  </p>
                </div>

                <div className="p-4 sm:p-5 bg-green-100 dark:bg-gray-700 rounded-lg shadow-md text-center">
                  <p className="text-gray-700 dark:text-gray-200 text-sm sm:text-base">
                    Success Rate (High Performers)
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                    {analytics.successRate?.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Performer Rankings */}
            {analytics.performers?.length > 0 ? (
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                  🧾 Participant Rankings
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
                    <thead className="bg-teal-600 text-white text-sm sm:text-base">
                      <tr>
                        <th className="px-4 py-2 text-left">#</th>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Score</th>
                        <th className="px-4 py-2 text-left">Accuracy (%)</th>
                        <th className="px-4 py-2 text-left">Reward Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.performers.map((p, i) => (
                        <tr
                          key={i}
                          className={`border-b dark:border-gray-700 ${
                            i % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : ""
                          }`}
                        >
                          <td className="px-4 py-2 text-sm sm:text-base">
                            {i + 1}
                          </td>
                          <td className="px-4 py-2 flex items-center gap-2">
                            <User className="text-teal-500 w-4 h-4" />
                            <span className="font-medium text-gray-800 dark:text-gray-100">
                              {p.name}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                            {p.score}
                          </td>
                          <td className="px-4 py-2 text-teal-600 dark:text-teal-400 font-semibold text-sm sm:text-base">
                            {p.percent}%
                          </td>
                          <td className="px-4 py-2 text-sm sm:text-base">
                            {parseFloat(p.percent) >= 60 ? (
                              <span className="text-green-600 dark:text-green-400 font-semibold">
                                Reward Recommended
                              </span>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">
                                Needs Improvement
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                No participants yet for this quiz.
              </p>
            )}
          </div>
        )}

        {!loading && !analytics && selectedQuiz && (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            No analytics available for this quiz yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default AdminQuizAnalytics;
