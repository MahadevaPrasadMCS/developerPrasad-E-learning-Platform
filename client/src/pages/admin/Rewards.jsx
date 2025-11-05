import React, { useEffect, useState } from "react";
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

function Rewards() {
  const { token, user } = useAuth();
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
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [summaryRes, rewardsRes, usersRes] = await Promise.all([
        api.get("/rewards/summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/rewards", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setSummary(summaryRes.data);
      setRewards(rewardsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Error fetching rewards data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        "/rewards",
        { ...formData, adminName: user?.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Reward added successfully!");
      setFormData({ userId: "", coins: "", reason: "" });
      fetchData();
    } catch {
      setMessage("❌ Failed to add reward.");
    }
  };

  if (user?.role !== "admin")
    return (
      <p className="text-center mt-10 text-red-500">
        Access denied — Admins only.
      </p>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-6 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400">
          💰 Rewards & Analytics Dashboard
        </h1>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          <div className="bg-green-100/90 dark:bg-green-900/50 rounded-2xl p-6 shadow hover:shadow-xl transition-all">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Total Rewards
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-300 mt-2 animate-pulse">
              +{summary.totalRewards}
            </p>
          </div>

          <div className="bg-red-100/90 dark:bg-red-900/50 rounded-2xl p-6 shadow hover:shadow-xl transition-all">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Total Deductions
            </h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-300 mt-2 animate-pulse">
              -{summary.totalDeductions}
            </p>
          </div>

          <div className="bg-teal-100/90 dark:bg-teal-900/50 rounded-2xl p-6 shadow hover:shadow-xl transition-all">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Total Users Rewarded
            </h3>
            <p className="text-3xl font-bold text-teal-600 dark:text-teal-300 mt-2 animate-pulse">
              {summary.totalUsers}
            </p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg p-8 transition-all hover:shadow-2xl">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            📊 Coin Flow Over Time
          </h2>
          {loading ? (
            <p className="text-center text-gray-500">Loading chart...</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rewards.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={(date) => date.slice(0, 10)}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="coins"
                  stroke="#14b8a6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Add Reward Form */}
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg p-8 space-y-4 hover:shadow-2xl transition-all"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            🎁 Add Reward / Deduction
          </h2>

          <select
            name="userId"
            value={formData.userId}
            onChange={(e) =>
              setFormData({ ...formData, userId: e.target.value })
            }
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
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
            placeholder="Enter coins (negative for deduction)"
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
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
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            required
          />

          <button
            type="submit"
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition"
          >
            Add Reward
          </button>

          {message && (
            <p className="text-center text-teal-600 dark:text-teal-400 mt-2">
              {message}
            </p>
          )}
        </form>

        {/* Reward History Table */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg p-8 transition-all hover:shadow-2xl">
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
                      No rewards recorded.
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
