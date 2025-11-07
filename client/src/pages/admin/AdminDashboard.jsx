import React, { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";

function AdminDashboard() {
  const [userGrowth, setUserGrowth] = useState([]);
  const [quizParticipation, setQuizParticipation] = useState([]);
  const [coinStats, setCoinStats] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const adminHeaders = { "X-Auth-Role": "admin" };
  const COLORS = ["#14b8a6", "#0d9488", "#2dd4bf", "#5eead4", "#99f6e4"];

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStats = async () => {
    try {
      const [users, quizzes, coins, actives] = await Promise.all([
        api.get("/admin/stats/users-growth", { headers: adminHeaders }),
        api.get("/admin/stats/quiz-participation", { headers: adminHeaders }),
        api.get("/admin/stats/coins", { headers: adminHeaders }),
        api.get("/admin/stats/active-users", { headers: adminHeaders }),
      ]);
      setUserGrowth(users.data);
      setQuizParticipation(quizzes.data);
      setCoinStats(coins.data);
      setActiveUsers(actives.data);
      showToast("✅ Dashboard data loaded", "success");
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      showToast("❌ Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading)
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
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400">
          📊 Admin Dashboard
        </h1>

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
                No user data yet.
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
                  <Bar dataKey="attempts" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No quiz participation data yet.
              </p>
            )}
          </div>
        </div>

        {/* Coin Distribution & Active Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coin Distribution Pie */}
          {coinStats && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                💰 Top 10 Users by Coins
              </h2>
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
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No coin data yet.
                </p>
              )}
            </div>
          )}

          {/* Active Users */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              🔥 Most Active Users
            </h2>
            {activeUsers.length > 0 ? (
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
                    {activeUsers.map((u, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-gray-700/40 transition-all"
                      >
                        <td className="py-2 px-3 font-semibold text-teal-600 dark:text-teal-400">
                          {i + 1}
                        </td>
                        <td className="py-2 px-3">{u.name}</td>
                        <td className="py-2 px-3">{u.email}</td>
                        <td className="py-2 px-3 text-center">{u.attempts}</td>
                        <td className="py-2 px-3 text-center">{u.coins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No activity data yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
