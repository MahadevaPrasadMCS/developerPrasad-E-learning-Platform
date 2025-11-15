import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart3,
  Loader2,
  User,
  Download,
  Gift,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function AdminQuizAnalytics() {
  const { user, token } = useAuth(); // assumes AuthContext exposes both

  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState("completed"); // completed | invalidated | all
  const [rewardConfig, setRewardConfig] = useState({
    topPercent: 60,
    coins: 20,
  });

  const [csvDownloading, setCsvDownloading] = useState(false);
  const [rewardLoading, setRewardLoading] = useState(false);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  /* =========================================================
     Fetch Quizzes (Admin List)
  ========================================================= */
  const fetchQuizzes = useCallback(async () => {
    try {
      const res = await api.get("/quiz/list", {
        headers: authHeaders,
        params: { page: 1, limit: 50 },
      });
      setQuizzes(res.data?.quizzes || []);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
    }
  }, [authHeaders]);

  /* =========================================================
     Fetch Analytics for Selected Quiz
  ========================================================= */
  const fetchAnalytics = useCallback(async () => {
    if (!selectedQuiz?._id) return;
    setLoading(true);
    try {
      const res = await api.get(
        `/quiz/${selectedQuiz._id}/analytics`,
        {
          headers: authHeaders,
          params: { filter },
        }
      );
      setAnalytics(res.data);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [selectedQuiz, filter, authHeaders]);

  /* =========================================================
     Effects
  ========================================================= */
  useEffect(() => {
    if (!token) return;
    fetchQuizzes();
  }, [token, fetchQuizzes]);

  useEffect(() => {
    if (!selectedQuiz) return;
    fetchAnalytics();
  }, [selectedQuiz, filter, fetchAnalytics]);

  /* =========================================================
     CSV Download
  ========================================================= */
  const handleDownloadCSV = () => {
    if (!analytics?.performers?.length) return;
    setCsvDownloading(true);

    try {
      const headersRow = "Name,Score,Percentage,Status,Violations\n";
      const rows = analytics.performers
        .map(
          (p) =>
            `${p.name},${p.score},${p.percent},${p.status},${p.violations}`
        )
        .join("\n");

      const blob = new Blob([headersRow + rows], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedQuiz.title}-analytics.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV download failed:", err);
    } finally {
      setCsvDownloading(false);
    }
  };

  /* =========================================================
     Reward Top Performers
  ========================================================= */
  const handleDistributeRewards = async () => {
    if (!selectedQuiz?._id) return;
    setRewardLoading(true);
    try {
      const res = await api.post(
        `/quiz/${selectedQuiz._id}/reward`,
        {
          topPercent: rewardConfig.topPercent,
          coins: rewardConfig.coins,
        },
        { headers: authHeaders }
      );
      alert(
        `Rewards distributed to ${res.data.rewardedCount || 0} participant(s).`
      );
      await fetchAnalytics();
    } catch (err) {
      console.error("Reward distribution failed:", err);
      alert("Reward distribution failed. Check console for details.");
    } finally {
      setRewardLoading(false);
    }
  };

  /* =========================================================
     Guard: Admin Only
  ========================================================= */
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="px-6 py-4 rounded-xl bg-white dark:bg-gray-800 shadow-lg text-center border border-red-200/70 dark:border-red-600/50">
          <p className="text-red-600 dark:text-red-400 font-semibold">
            Access denied — Admins only.
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     Render Helpers
  ========================================================= */
  const renderSummaryCards = () => {
    if (!analytics) return null;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="p-4 sm:p-5 bg-teal-50 dark:bg-gray-800 rounded-xl shadow-sm border border-teal-100 dark:border-gray-700 text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            Total Participants
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-teal-600 dark:text-teal-400">
            {analytics.totalUsers}
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-yellow-50 dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-100 dark:border-gray-700 text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            Average Accuracy
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {analytics.averageScore?.toFixed(2)}%
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-emerald-50 dark:bg-gray-800 rounded-xl shadow-sm border border-emerald-100 dark:border-gray-700 text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            Success Rate (≥ 60%)
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {analytics.successRate?.toFixed(2)}%
          </p>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    if (!analytics?.performers?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100">
            Score Distribution
          </h3>
          <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            Accuracy (%) vs Participants
          </span>
        </div>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.performers}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (!analytics?.performers) return null;

    if (!analytics.performers.length) {
      return (
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-6">
          No participants yet for this quiz (with current filter).
        </p>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl text-sm sm:text-base">
          <thead className="bg-teal-600 text-white">
            <tr>
              <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm">
                #
              </th>
              <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm">
                Participant
              </th>
              <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm">
                Score
              </th>
              <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm">
                Accuracy (%)
              </th>
              <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm">
                Status
              </th>
              <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm">
                Violations
              </th>
              <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm">
                Reward Recommendation
              </th>
            </tr>
          </thead>
          <tbody>
            {analytics.performers.map((p, i) => {
              const percentNum = parseFloat(p.percent);
              const isHigh = percentNum >= 60;
              const isInvalidated = p.status === "invalidated";

              return (
                <tr
                  key={`${p.name}-${i}`}
                  className={`border-b dark:border-gray-700 ${
                    i % 2 === 0
                      ? "bg-gray-50 dark:bg-gray-900"
                      : "bg-white dark:bg-gray-800"
                  }`}
                >
                  <td className="px-3 sm:px-4 py-2 align-middle">
                    {i + 1}
                  </td>
                  <td className="px-3 sm:px-4 py-2 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                        <User className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {p.name || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2 align-middle text-gray-800 dark:text-gray-100">
                    {p.score}
                  </td>
                  <td className="px-3 sm:px-4 py-2 align-middle">
                    <span
                      className={`font-semibold ${
                        isHigh
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {p.percent}%
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-2 align-middle">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold ${
                        isInvalidated
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : p.status === "completed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {p.status || "—"}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-2 align-middle text-center">
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                      {p.violations ?? 0}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-2 align-middle">
                    {isHigh && !isInvalidated ? (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        Reward Recommended
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        Needs Improvement
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  /* =========================================================
     Render
  ========================================================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 py-6 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-teal-500 w-7 h-7" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-teal-600 dark:text-teal-400">
                Quiz Analytics Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Monitor performance, detect issues, and reward top learners.
              </p>
            </div>
          </div>
        </div>

        {/* Quiz Selector */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            onChange={(e) =>
              setSelectedQuiz(
                quizzes.find((q) => q._id === e.target.value) || null
              )
            }
            className="w-full sm:w-2/3 p-3 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm sm:text-base focus:ring-2 focus:ring-teal-500"
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

          {selectedQuiz && (
            <div className="flex items-center gap-2 sm:justify-end flex-1">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-300" />
              {["completed", "invalidated", "all"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${
                    filter === f
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-10 text-center text-gray-600 dark:text-gray-300">
            <Loader2 className="animate-spin inline-block mr-2" />
            Loading analytics...
          </div>
        )}

        {/* No quiz selected */}
        {!loading && !selectedQuiz && (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base py-10">
            Select a quiz from the dropdown above to view analytics.
          </p>
        )}

        {/* Analytics Content */}
        {!loading && selectedQuiz && analytics && (
          <>
            {/* Title */}
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {analytics.title || selectedQuiz.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
              Filter: <span className="font-medium">{filter}</span>
            </p>

            {renderSummaryCards()}
            {renderChart()}
            {renderTable()}

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              {/* Reward Config */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Reward settings:
                </span>
                <label className="flex items-center gap-1">
                  <span className="text-gray-500 dark:text-gray-400">
                    Min %
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={rewardConfig.topPercent}
                    onChange={(e) =>
                      setRewardConfig((prev) => ({
                        ...prev,
                        topPercent: Number(e.target.value || 0),
                      }))
                    }
                    className="w-16 px-2 py-1 border rounded-md text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </label>
                <label className="flex items-center gap-1">
                  <span className="text-gray-500 dark:text-gray-400">
                    Coins
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={rewardConfig.coins}
                    onChange={(e) =>
                      setRewardConfig((prev) => ({
                        ...prev,
                        coins: Number(e.target.value || 0),
                      }))
                    }
                    className="w-16 px-2 py-1 border rounded-md text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </label>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownloadCSV}
                  disabled={!analytics?.performers?.length || csvDownloading}
                  className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${
                    !analytics?.performers?.length || csvDownloading
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  {csvDownloading ? "Preparing CSV..." : "Download CSV"}
                </button>

                <button
                  onClick={handleDistributeRewards}
                  disabled={
                    !analytics?.performers?.length ||
                    rewardLoading ||
                    rewardConfig.coins <= 0
                  }
                  className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${
                    !analytics?.performers?.length ||
                    rewardLoading ||
                    rewardConfig.coins <= 0
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  <Gift className="w-4 h-4" />
                  {rewardLoading ? "Rewarding..." : "Reward Top Performers"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Selected but no analytics */}
        {!loading && selectedQuiz && !analytics && (
          <p className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            No analytics available yet for this quiz.
          </p>
        )}
      </div>
    </div>
  );
}

export default AdminQuizAnalytics;
