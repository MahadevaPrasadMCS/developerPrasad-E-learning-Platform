// src/pages/ceo/CeoDashboard.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import {
  Users,
  Clock,
  BarChart3,
  AlertTriangle,
  Server,
  Database,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function CeoDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);
  const navigate = useNavigate();

  const COLORS = {
    CEO: "#6366f1",
    ADMIN: "#14b8a6",
    EDUCATOR: "#f59e0b",
    STUDENT: "#10b981",
    GUEST: "#ef4444",
    DEFAULT: "#64748b",
  };

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || "-",
      icon: Users,
      theme: "bg-blue-500",
      onClick: () => navigate("/ceo/users"),
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
      onClick: () => navigate("/ceo/manage-roles"),
    },
  ];

  async function fetchStats() {
    try {
      const res = await api.get("/ceo/stats");
      const data = res.data;

      setStats({
        totalUsers: data?.userCounts?.total || 0,
        pendingPromotions: 0,
        activeLogsToday: 0,
        roleCounts: data?.userCounts || {},
      });

      const trendRes = await api.get("/ceo/user-trends"); // Optional backend
      setTrendData(
        trendRes.data?.trends || [
          { month: "Jan", users: 50 },
          { month: "Feb", users: 70 },
          { month: "Mar", users: 120 },
          { month: "Apr", users: 160 },
        ]
      );
    } catch (err) {
      console.error("Failed to load CEO stats:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const roleData =
    stats?.roleCounts && Object.keys(stats.roleCounts).length
      ? Object.entries(stats.roleCounts).map(([role, count]) => ({
          name: role,
          value: count,
          fill: COLORS[role] || COLORS.DEFAULT,
        }))
      : [];

  return (
    <div className="space-y-8 animate-fadeIn">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
        CEO Dashboard
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((item, i) => (
          <div
            key={i}
            onClick={item.onClick}
            className="p-5 rounded-2xl shadow bg-white dark:bg-gray-900 
              border border-gray-200 dark:border-gray-800 
              hover:shadow-xl hover:-translate-y-1 transition cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm dark:text-gray-400">
                  {item.label}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    item.value
                  )}
                </h3>
              </div>
              <div className={`p-3 rounded-xl text-white ${item.theme}`}>
                <item.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Growth Trend */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Growth (Monthly)
        </h3>

        {loading ? (
          <p className="text-center text-gray-500 animate-pulse">
            Loading trend...
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Line type="monotone" dataKey="users" />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Role Chart */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Role Distribution
        </h3>

        {loading ? (
          <p className="text-center text-gray-500 animate-pulse">
            Loading chart...
          </p>
        ) : roleData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  dataKey="value"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {roleData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No role data available
          </p>
        )}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "API Status", value: "Operational", icon: Server },
          { label: "Database Status", value: "Stable", icon: Database },
        ].map((sys, i) => (
          <div
            key={i}
            className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl 
            flex items-center gap-3 border border-green-200 dark:border-green-700"
          >
            <sys.icon className="text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {sys.label}
              </p>
              <p className="font-semibold text-green-700 dark:text-green-300">
                {sys.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
