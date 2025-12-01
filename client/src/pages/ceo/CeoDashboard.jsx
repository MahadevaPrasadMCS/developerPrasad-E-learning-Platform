// src/pages/ceo/CeoDashboard.jsx
import { useEffect, useState } from "react";
import api from "../../utils/api";
import {
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function CeoDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#14b8a6", "#6366f1", "#f59e0b", "#10b981", "#ef4444"];

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || "-",
      icon: Users,
      theme: "bg-blue-500",
    },
    {
      label: "Pending Promotions",
      value: stats?.pendingPromotions || "-",
      icon: AlertTriangle,
      theme: "bg-amber-500",
    },
    {
      label: "Logs Today",
      value: stats?.activeLogsToday || "-",
      icon: Clock,
      theme: "bg-red-500",
    },
    {
      label: "Role Insights",
      value: "View",
      icon: BarChart3,
      theme: "bg-purple-600",
    },
  ];

  async function fetchStats() {
    try {
      const res = await api.get("/ceo/stats");
      const data = res.data;

      setStats({
        totalUsers: data?.userCounts?.total || 0,
        pendingPromotions: 0, // will be enabled when backend provides it
        activeLogsToday: 0, // logs tracking will come later
        roleCounts: data?.userCounts || {}
      });

    } catch (err) {
      console.error("Failed to load CEO stats:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const roleData = stats?.roleCounts
    ? Object.entries(stats.roleCounts).map(([role, count]) => ({
        name: role,
        value: count,
      }))
    : [];

  return (
    <div className="space-y-8 animate-fadeIn">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
        CEO Dashboard
      </h2>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm font-medium dark:text-gray-400">
                  {item.label}
                </p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                  {loading ? "..." : item.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl text-white ${item.theme}`}>
                <item.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role Breakdown Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          User Role Distribution
        </h3>

        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Loading chart...
          </p>
        ) : roleData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name }) => name}
                >
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No role data available</p>
        )}
      </div>
    </div>
  );
}
