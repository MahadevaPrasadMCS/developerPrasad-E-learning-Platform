import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import api from "../../utils/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Loader2, RefreshCw, Clock, Download, Zap } from "lucide-react";

function AdminDashboard() {
  const [userGrowth, setUserGrowth] = useState([]);
  const [quizParticipation, setQuizParticipation] = useState([]);
  const [coinStats, setCoinStats] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });

  const [activeUserSearch, setActiveUserSearch] = useState("");
  const [activeUserSort, setActiveUserSort] = useState("attempts"); // "attempts" | "coins"

  const isFirstLoad = useRef(true);

  // If you still need extra headers for admin APIs, configure here.
  const adminHeaders = useMemo(
    () => ({
      "X-Auth-Role": "admin",
    }),
    []
  );

  const COLORS = ["#14b8a6", "#0d9488", "#2dd4bf", "#5eead4", "#99f6e4"];

  // Toast system
  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const buildParams = () => {
    const params = {};
    if (dateRange.from) params.from = dateRange.from;
    if (dateRange.to) params.to = dateRange.to;
    return params;
  };

  const exportToCSV = (filename, rows) => {
    if (!rows || rows.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h] ?? "";
            // Escape quotes and commas
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filename}`, "success");
  };

  // Main fetch
  const fetchStats = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) {
          setInitialLoading(true);
        } else {
          setRefreshing(true);
        }

        const params = buildParams();

        const [users, quizzes, coins, actives] = await Promise.all([
          api.get("/admin/stats/users-growth", {
            headers: adminHeaders,
            params,
          }),
          api.get("/admin/stats/quiz-participation", {
            headers: adminHeaders,
            params,
          }),
          api.get("/admin/stats/coins", {
            headers: adminHeaders,
          }),
          api.get("/admin/stats/active-users", {
            headers: adminHeaders,
            params,
          }),
        ]);

        setUserGrowth(users.data || []);
        setQuizParticipation(quizzes.data || []);
        setCoinStats(coins.data || null);
        setActiveUsers(actives.data || []);

        setLastUpdated(new Date());
        showToast("Dashboard data updated", "success");
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        showToast("Failed to load dashboard data", "error");
      } finally {
        if (isInitial) {
          setInitialLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [adminHeaders, dateRange.from, dateRange.to]
  );

  // Initial + on-date-range change
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchStats(true);
    } else {
      // When date filter changes, refresh data without full-screen loader
      fetchStats(false);
    }
  }, [fetchStats]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const id = setInterval(() => {
      fetchStats(false);
    }, 60_000); // 60 seconds

    return () => clearInterval(id);
  }, [autoRefresh, fetchStats]);

  const handleQuickRange = (monthsBack) => {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - monthsBack);

    const toStr = to.toISOString().slice(0, 10);
    const fromStr = from.toISOString().slice(0, 10);

    setDateRange({ from: fromStr, to: toStr });
  };

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return "Not updated yet";
    return lastUpdated.toLocaleString();
  }, [lastUpdated]);

  const filteredActiveUsers = useMemo(() => {
    let list = [...activeUsers];

    if (activeUserSearch.trim()) {
      const q = activeUserSearch.toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (activeUserSort === "coins") {
        return (b.coins || 0) - (a.coins || 0);
      }
      // default: attempts
      return (b.attempts || 0) - (a.attempts || 0);
    });

    return list;
  }, [activeUsers, activeUserSearch, activeUserSort]);

  if (initialLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500 dark:text-gray-300">
        <Loader2 className="animate-spin w-10 h-10 mb-4 text-teal-500" />
        Fetching dashboard data...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in z-50 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-yellow-500 text-black"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
        {/* Header & controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-2">
              📊 Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
              <Clock className="w-4 h-4" />
              Last updated: {formattedLastUpdated}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            {/* Date range filter */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className="border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className="border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Quick ranges */}
            <div className="flex gap-1">
              <button
                onClick={() => handleQuickRange(1)}
                className="text-xs px-2 py-1 border border-teal-500 rounded-full text-teal-600 hover:bg-teal-50 dark:hover:bg-gray-800"
              >
                Last 30d
              </button>
              <button
                onClick={() => handleQuickRange(3)}
                className="text-xs px-2 py-1 border border-teal-500 rounded-full text-teal-600 hover:bg-teal-50 dark:hover:bg-gray-800"
              >
                Last 3m
              </button>
              <button
                onClick={() => handleQuickRange(6)}
                className="text-xs px-2 py-1 border border-teal-500 rounded-full text-teal-600 hover:bg-teal-50 dark:hover:bg-gray-800"
              >
                Last 6m
              </button>
            </div>

            {/* Refresh & auto-refresh */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchStats(false)}
                disabled={refreshing}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              <button
                onClick={() => setAutoRefresh((prev) => !prev)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border ${
                  autoRefresh
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700"
                }`}
              >
                <Zap className="w-4 h-4" />
                Auto {autoRefresh ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {coinStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: "Total Coins", value: coinStats.totalCoins },
              { label: "Average Coins/User", value: coinStats.avgCoins },
              { label: "Active Users", value: activeUsers.length },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all duration-300"
              >
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  {item.label}
                </p>
                <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                  {item.value}
                </h2>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Growth */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              👥 User Growth (Monthly)
            </h2>
            {userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#14b8a6"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No user data for selected range.
              </p>
            )}
          </div>

          {/* Quiz Participation */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              🧩 Quiz Participation (Monthly)
            </h2>
            {quizParticipation.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={quizParticipation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Bar
                    dataKey="attempts"
                    fill="#14b8a6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No quiz participation data for selected range.
              </p>
            )}
          </div>
        </div>

        {/* Coin Distribution & Active Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coin Distribution Pie */}
          {coinStats && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-md p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  💰 Top 10 Users by Coins
                </h2>
                <button
                  onClick={() =>
                    exportToCSV(
                      "top-coin-users.csv",
                      (coinStats.topUsers || []).map((u, idx) => ({
                        rank: idx + 1,
                        name: u.name,
                        coins: u.coins,
                      }))
                    )
                  }
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Download className="w-3 h-3" />
                  Export CSV
                </button>
              </div>

              {coinStats.topUsers?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={coinStats.topUsers}
                      dataKey="coins"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {coinStats.topUsers.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                  No coin data yet.
                </p>
              )}
            </div>
          )}

          {/* Active Users */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-md p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  🔥 Most Active Users
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ranked by {activeUserSort === "attempts" ? "attempts" : "coins"}
                </p>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search name/email"
                    value={activeUserSearch}
                    onChange={(e) => setActiveUserSearch(e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <select
                    value={activeUserSort}
                    onChange={(e) => setActiveUserSort(e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="attempts">Sort by Attempts</option>
                    <option value="coins">Sort by Coins</option>
                  </select>
                </div>

                <button
                  onClick={() =>
                    exportToCSV(
                      "active-users.csv",
                      filteredActiveUsers.map((u, idx) => ({
                        rank: idx + 1,
                        name: u.name,
                        email: u.email,
                        attempts: u.attempts,
                        coins: u.coins,
                      }))
                    )
                  }
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Download className="w-3 h-3" />
                  Export CSV
                </button>
              </div>
            </div>

            {filteredActiveUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3 text-left">Name</th>
                      <th className="py-2 px-3 text-left">Email</th>
                      <th className="py-2 px-3 text-center">Attempts</th>
                      <th className="py-2 px-3 text-center">Coins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActiveUsers.map((u, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-gray-700/40 transition-all"
                      >
                        <td className="py-2 px-3 font-semibold text-teal-600 dark:text-teal-400">
                          {i + 1}
                        </td>
                        <td className="py-2 px-3">{u.name}</td>
                        <td className="py-2 px-3">{u.email}</td>
                        <td className="py-2 px-3 text-center">
                          {u.attempts}
                        </td>
                        <td className="py-2 px-3 text-center">{u.coins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                No activity data for selected filters.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
