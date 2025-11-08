import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Loader2, Gift, Coins } from "lucide-react";

function Rewards() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    totalRewards: 0,
    totalDeductions: 0,
    totalUsers: 0,
  });
  const [rewards, setRewards] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userId: "",
    coins: "",
    reason: "",
  });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Memoize admin headers
  const adminHeaders = useMemo(() => ({ "X-Auth-Role": "admin" }), []);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, rewardsRes, usersRes] = await Promise.all([
        api.get("/rewards/summary", { headers: adminHeaders }),
        api.get("/rewards", { headers: adminHeaders }),
        api.get("/users", { headers: adminHeaders }),
      ]);
      setSummary(summaryRes.data);
      setRewards(rewardsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Error fetching rewards data:", err);
      showToast("❌ Failed to fetch rewards data.", "error");
    } finally {
      setLoading(false);
    }
  }, [adminHeaders]);

  useEffect(() => {
    if (user?.role === "admin") fetchData();
  }, [user, fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.userId || !formData.coins || !formData.reason)
      return showToast("⚠️ Please fill all fields.", "error");

    try {
      await api.post(
        "/rewards",
        { ...formData, adminName: user?.name },
        { headers: adminHeaders }
      );
      showToast("✅ Reward added successfully!", "success");
      setFormData({ userId: "", coins: "", reason: "" });
      fetchData();
    } catch (err) {
      console.error("Reward creation failed:", err);
      showToast(err.response?.data?.message || "❌ Failed to add reward.", "error");
    }
  };

  if (user?.role !== "admin")
    return (
      <div className="text-center text-red-500 font-semibold mt-10">
        Access denied — Admins only.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-6 animate-fade-in">
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

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400">
          💰 Rewards & Analytics Dashboard
        </h1>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          {[
            {
              title: "Total Rewards",
              value: `+${summary.totalRewards}`,
              color: "green",
            },
            {
              title: "Total Deductions",
              value: `-${summary.totalDeductions}`,
              color: "red",
            },
            {
              title: "Total Users Rewarded",
              value: summary.totalUsers,
              color: "teal",
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`bg-${card.color}-100/90 dark:bg-${card.color}-900/50 rounded-2xl p-6 shadow hover:shadow-xl transition-all animate-fade-in`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {card.title}
              </h3>
              <p
                className={`text-3xl font-bold text-${card.color}-600 dark:text-${card.color}-300 mt-2 animate-pulse`}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            📈 Coin Flow Over Time
          </h2>
          {loading ? (
            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-3" />
              Loading chart...
            </div>
          ) : rewards.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No reward data yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rewards.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" />
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={(date) => date.slice(0, 10)}
                  stroke="#9ca3af"
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="coins"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Add Reward Form */}
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg p-8 space-y-5 hover:shadow-2xl transition-all"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Gift className="text-teal-500" /> Add Reward / Deduction
          </h2>

          <select
            name="userId"
            value={formData.userId}
            onChange={(e) =>
              setFormData({ ...formData, userId: e.target.value })
            }
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          >
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>

          <input
            type="number"
            name="coins"
            value={formData.coins}
            onChange={(e) =>
              setFormData({ ...formData, coins: parseInt(e.target.value) })
            }
            placeholder="Enter coins (+/-)"
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          />

          <input
            type="text"
            name="reason"
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
            placeholder="Reason for reward"
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          />

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow transition-all duration-300"
          >
            <Coins size={18} /> Submit Reward
          </button>
        </form>

        {/* Reward History */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            🧾 Reward History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                <tr>
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Coins</th>
                  <th className="p-3 text-left">Reason</th>
                  <th className="p-3 text-left">Admin</th>
                  <th className="p-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {rewards.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-6 text-gray-500 dark:text-gray-400"
                    >
                      No rewards recorded yet.
                    </td>
                  </tr>
                ) : (
                  rewards.map((r, index) => (
                    <tr
                      key={r._id}
                      className={`border-t border-gray-200 dark:border-gray-700 transition-all duration-300 ${
                        r.coins > 0
                          ? "hover:bg-green-50 dark:hover:bg-green-900/20"
                          : "hover:bg-red-50 dark:hover:bg-red-900/20"
                      } animate-fade-in`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <td className="p-3">{r.user?.name}</td>
                      <td
                        className={`p-3 font-semibold ${
                          r.coins > 0
                            ? "text-green-500 dark:text-green-400"
                            : "text-red-500 dark:text-red-400"
                        }`}
                      >
                        {r.coins > 0 ? "+" : ""}
                        {r.coins}
                      </td>
                      <td className="p-3">{r.reason}</td>
                      <td className="p-3">{r.admin || "System"}</td>
                      <td className="p-3">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rewards;
