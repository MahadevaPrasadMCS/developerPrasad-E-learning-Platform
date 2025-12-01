import { useEffect, useState } from "react";
import api from "../../utils/api";
import {
  Users,
  BarChart3,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#14b8a6", "#6366f1", "#f97316", "#06b6d4"];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/ceo/stats");
        setData(res.data);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-600 dark:text-gray-300">
        Loading analytics…
      </p>
    );

  if (!data)
    return (
      <p className="text-center mt-10 text-red-500">
        Failed to load analytics
      </p>
    );

  const { userCounts, quizCounts, walletStats, monthlyUsers } = data;

  const pieData = Object.entries(userCounts || {})
    .filter(([role]) => role !== "total")
    .map(([role, count]) => ({ name: role, value: count }));

  const cards = [
    {
      title: "Total Users",
      value: userCounts.total,
      icon: Users,
      color: "bg-teal-500",
    },
    {
      title: "Active Quizzes",
      value: quizCounts.active,
      icon: BarChart3,
      color: "bg-indigo-500",
    },
    {
      title: "Total Wallet Txns",
      value: walletStats.transactions,
      icon: TrendingUp,
      color: "bg-emerald-500",
    },
    {
      title: "Growth",
      value: walletStats.growth,
      icon: Activity,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-2xl font-bold">Platform Analytics</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((item, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl shadow bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center gap-4"
          >
            <div
              className={`p-3 rounded-xl text-white ${item.color}`}
            >
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.title}
              </p>
              <p className="text-xl font-bold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User by Role */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl shadow border dark:border-slate-800">
          <h3 className="font-bold mb-3">User Roles Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={90}
                  label
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly New Users */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl shadow border dark:border-slate-800">
          <h3 className="font-bold mb-3">Monthly User Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyUsers}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mobile footer spacing fix */}
      <div className="h-8" />
    </div>
  );
}
