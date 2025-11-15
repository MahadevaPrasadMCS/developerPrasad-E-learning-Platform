import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
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
import {
  Loader2,
  Gift,
  Coins,
  Download,
  Search,
} from "lucide-react";

function Rewards() {
  const { user, token } = useAuth();

  const [summary, setSummary] = useState({
    totalRewards: 0,
    totalDeductions: 0,
    totalUsers: 0,
  });
  const [rewards, setRewards] = useState([]);
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [dateFilter, setDateFilter] = useState("");

  const [formData, setFormData] = useState({
    userId: "",
    coins: "",
    reason: "",
  });

  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const adminHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const params = {};
      if (dateFilter) params.period = dateFilter;
      if (search) params.search = search;

      const [summaryRes, rewardsRes, usersRes] = await Promise.all([
        api.get("/rewards/summary", { headers: adminHeaders }),
        api.get("/rewards", { headers: adminHeaders, params }),
        api.get("/users", { headers: adminHeaders }),
      ]);

      setSummary(summaryRes.data);
      setRewards(rewardsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Reward fetch failed:", err);
      showToast("Failed to load rewards", "error");
    } finally {
      setLoading(false);
    }
  }, [adminHeaders, search, dateFilter]);

  useEffect(() => {
    if (user?.role === "admin") fetchData();
  }, [fetchData, user]);

  const exportCSV = () => {
    if (!rewards.length) return showToast("No data to export", "error");

    const csv = [
      "User,Coins,Reason,Admin,Date",
      ...rewards.map(
        (r) =>
          `${r.user?.name},${r.coins},${r.reason},${r.admin},${new Date(
            r.createdAt
          ).toLocaleString()}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reward-history.csv";
    link.click();
  };

  const filteredRewards = useMemo(() => {
    let list = [...rewards];

    if (sort === "high") list.sort((a, b) => b.coins - a.coins);
    else if (sort === "low") list.sort((a, b) => a.coins - b.coins);
    else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return list;
  }, [rewards, sort]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.userId || !formData.coins || !formData.reason)
      return showToast("Fill all fields!", "error");

    try {
      await api.post(
        "/rewards",
        { ...formData, adminName: user?.name },
        { headers: adminHeaders }
      );

      showToast("Reward updated successfully", "success");
      setFormData({ userId: "", coins: "", reason: "" });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  };

  if (user?.role !== "admin")
    return (
      <div className="text-center text-red-500 font-semibold mt-20">
        Access denied.
      </div>
    );

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-100 dark:bg-gray-900">
      {toast && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded-lg shadow text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-10">
        <h1 className="text-4xl font-bold text-center text-teal-600 dark:text-teal-400">
          Rewards Management
        </h1>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              title: "Rewards Issued",
              value: `+${summary.totalRewards}`,
              color: "text-green-600",
            },
            {
              title: "Coins Deducted",
              value: `-${summary.totalDeductions}`,
              color: "text-red-600",
            },
            {
              title: "Users Impacted",
              value: summary.totalUsers,
              color: "text-teal-600",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 text-center"
            >
              <p className="text-gray-600 dark:text-gray-400">{c.title}</p>
              <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <div className="flex gap-2 items-center">
            <Search className="w-5 text-gray-500" />
            <input
              placeholder="Search user"
              value={search}
              className="bg-transparent border-b focus:outline-none w-40"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 rounded border dark:bg-gray-700"
          >
            <option value="recent">Recent First</option>
            <option value="high">Amount High → Low</option>
            <option value="low">Amount Low → High</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded border dark:bg-gray-700"
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
          </select>

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded shadow text-sm flex items-center gap-1"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 shadow rounded-xl">
          <h2 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Coin Trends
          </h2>

          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          ) : !rewards.length ? (
            <p className="text-center text-gray-500">No data</p>
          ) : (
            <ResponsiveContainer height={250}>
              <LineChart data={filteredRewards}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={(d) => d.slice(0, 10)}
                />
                <YAxis />
                <Tooltip />
                <Line
                  dataKey="coins"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Add Reward */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow space-y-4 max-w-3xl mx-auto"
        >
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Gift /> Grant / Deduct Coins
          </h2>

          <select
            name="userId"
            value={formData.userId}
            onChange={(e) =>
              setFormData((p) => ({ ...p, userId: e.target.value }))
            }
            className="w-full p-3 border rounded-lg dark:bg-gray-700"
          >
            <option value="">Select a User</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Coins (+ or -)"
            value={formData.coins}
            onChange={(e) =>
              setFormData((p) => ({ ...p, coins: Number(e.target.value) }))
            }
            className="w-full p-3 border rounded-lg dark:bg-gray-700"
          />

          <input
            placeholder="Reason"
            value={formData.reason}
            onChange={(e) =>
              setFormData((p) => ({ ...p, reason: e.target.value }))
            }
            className="w-full p-3 border rounded-lg dark:bg-gray-700"
          />

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-3 rounded-lg flex justify-center gap-2 shadow hover:bg-teal-700"
          >
            <Coins /> Apply
          </button>
        </form>

        {/* Reward Table */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-200 dark:bg-gray-700 text-left">
              <tr>
                <th className="p-2">User</th>
                <th className="p-2">Coins</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Admin</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {!filteredRewards.length ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center text-gray-500 py-6"
                  >
                    No rewards yet
                  </td>
                </tr>
              ) : (
                filteredRewards.map((r) => (
                  <tr
                    key={r._id}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td className="p-2">{r.user?.name}</td>
                    <td
                      className={`p-2 font-bold ${
                        r.coins >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {r.coins}
                    </td>
                    <td className="p-2">{r.reason}</td>
                    <td className="p-2">{r.admin}</td>
                    <td className="p-2">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Rewards;
