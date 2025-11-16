// src/pages/admin/AdminDashboard.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useOutletContext } from "react-router-dom";
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
import {
  Loader2,
  RefreshCw,
  Clock,
  Download,
  Zap,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/* ======================= Helpers & Constants ======================= */

const BASE_COLORS = ["#22c55e", "#0ea5e9", "#a855f7", "#eab308", "#f97316"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function dateToISO(d) {
  if (!d) return "";
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoToDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function isoToDisplay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}-${m}-${y}`;
}

/* ======================= UI Subcomponents ======================= */

function Toast({ toast }) {
  if (!toast) return null;
  const base =
    "fixed z-50 px-4 py-2 rounded-lg shadow-lg text-xs sm:text-sm font-medium animate-fade-in";
  const color =
    toast.type === "success"
      ? "bg-emerald-600 text-white"
      : toast.type === "error"
      ? "bg-rose-600 text-white"
      : "bg-amber-500 text-black";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${base} ${color} bottom-4 left-1/2 -translate-x-1/2 sm:bottom-auto sm:left-auto sm:right-5 sm:top-5 sm:translate-x-0`}
    >
      {toast.msg}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-white/90 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-5 text-center shadow-sm hover:shadow-md transition-shadow duration-200">
      <p className="text-slate-500 dark:text-slate-400 mb-1 text-[11px] sm:text-xs uppercase tracking-wide">
        {label}
      </p>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 break-words">
        {value ?? "-"}
      </h2>
    </div>
  );
}

function SectionCard({ title, subtitle, actions, children }) {
  return (
    <section className="bg-white/95 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none p-3 sm:p-5 flex flex-col gap-4">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            {actions}
          </div>
        )}
      </header>
      {children}
    </section>
  );
}

/* ======================= Custom Calendar ======================= */

function CalendarGrid({ monthDate, selected, onSelect }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();

  const cells = [];
  let currentDay = 1 - startDay;

  for (let week = 0; week < 6; week++) {
    const row = [];
    for (let dow = 0; dow < 7; dow++) {
      const cellDate = new Date(year, month, currentDay);
      const inCurrent = cellDate.getMonth() === month;
      const iso = dateToISO(cellDate);
      const isSelected = selected && iso === selected;

      row.push({
        date: cellDate,
        inCurrent,
        iso,
        isSelected,
        key: `${year}-${month}-${week}-${dow}`,
      });
      currentDay++;
    }
    cells.push(row);
  }

  return (
    <div className="grid grid-cols-7 text-center gap-1 text-[10px] sm:text-[11px]">
      {WEEKDAYS_SHORT.map((d) => (
        <div
          key={d}
          className="text-slate-500 dark:text-slate-400 font-medium pb-1 border-b border-slate-200/80 dark:border-slate-700/60"
        >
          {d}
        </div>
      ))}
      {cells.map((row) =>
        row.map((cell) => (
          <button
            key={cell.key}
            type="button"
            onClick={() => cell.inCurrent && onSelect(cell.date)}
            className={`h-7 sm:h-8 rounded-full flex items-center justify-center transition-colors ${
              !cell.inCurrent
                ? "text-slate-300 dark:text-slate-600"
                : cell.isSelected
                ? "bg-emerald-500 text-white font-semibold"
                : "text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {cell.date.getDate()}
          </button>
        ))
      )}
    </div>
  );
}

function DatePickerField({ label, value, onChange, id }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = isoToDate(value);
    return d || new Date();
  });

  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelectDate = (date) => {
    const iso = dateToISO(date);
    onChange(iso);
    setViewMonth(date);
    setOpen(false);
  };

  const display = value ? isoToDisplay(value) : "";

  const goMonth = (offset) => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() + offset);
    setViewMonth(d);
  };

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 15; y <= currentYear + 5; y++) years.push(y);

  const handleMonthChange = (e) => {
    const newMonth = Number(e.target.value);
    const d = new Date(viewMonth);
    d.setMonth(newMonth);
    setViewMonth(d);
  };

  const handleYearChange = (e) => {
    const newYear = Number(e.target.value);
    const d = new Date(viewMonth);
    d.setFullYear(newYear);
    setViewMonth(d);
  };

  return (
    <div className="flex flex-col gap-1 relative" ref={wrapperRef}>
      <label
        htmlFor={id}
        className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400"
      >
        {label}
      </label>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between gap-2 w-full rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <span className={display ? "" : "text-slate-400 dark:text-slate-500"}>
          {display || "dd-mm-yyyy"}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      </button>

      {open && (
        <div className="absolute z-40 top-full mt-2 right-0 sm:right-auto sm:left-0 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/50 p-3 sm:p-4">
          {/* Month / Year selector + arrows */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
            >
              ‹
            </button>
            <div className="flex-1 flex items-center justify-center gap-1">
              <select
                value={viewMonth.getMonth()}
                onChange={handleMonthChange}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-md px-1.5 py-1 text-[11px] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m.slice(0, 3)}
                  </option>
                ))}
              </select>
              <select
                value={viewMonth.getFullYear()}
                onChange={handleYearChange}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-md px-1.5 py-1 text-[11px] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => goMonth(1)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
            >
              ›
            </button>
          </div>

          <CalendarGrid
            monthDate={viewMonth}
            selected={value}
            onSelect={handleSelectDate}
          />

          <div className="flex justify-between items-center mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => onChange("")}
              className="hover:text-slate-800 dark:hover:text-slate-200"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleSelectDate(new Date())}
              className="hover:text-emerald-500"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================= Main Page ======================= */

function AdminDashboard() {
  const { sidebarCollapsed, sidebarBaseWidth } = useOutletContext();
  const { darkMode } = useTheme();

  const [userGrowth, setUserGrowth] = useState([]);
  const [quizParticipation, setQuizParticipation] = useState([]);
  const [coinStats, setCoinStats] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [activeUserSearch, setActiveUserSearch] = useState("");
  const [activeUserSort, setActiveUserSort] = useState("attempts");

  const isFirstLoad = useRef(true);

  const adminHeaders = useMemo(
    () => ({
      "X-Auth-Role": "admin",
    }),
    []
  );

  // Theme-aware chart palette
  const chartColors = useMemo(
    () => ({
      grid: darkMode ? "#1e293b" : "#e5e7eb",
      axis: darkMode ? "#9ca3af" : "#6b7280",
      tooltipBg: darkMode ? "#020617" : "#ffffff",
      tooltipBorder: darkMode ? "#1e293b" : "#e5e7eb",
      line: darkMode ? "#22c55e" : "#16a34a",
      bar: darkMode ? "#22c55e" : "#16a34a",
      pie: BASE_COLORS,
    }),
    [darkMode]
  );

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
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
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

  const fetchStats = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setInitialLoading(true);
        else setRefreshing(true);

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

        if (!isInitial) showToast("Dashboard data updated", "success");
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        showToast("Failed to load dashboard data", "error");
      } finally {
        if (isInitial) setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [adminHeaders, dateRange.from, dateRange.to]
  );

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchStats(true);
    } else {
      fetchStats(false);
    }
  }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      fetchStats(false);
    }, 60_000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchStats]);

  const handleQuickRange = (monthsBack) => {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - monthsBack);

    const toStr = dateToISO(to);
    const fromStr = dateToISO(from);

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
      return (b.attempts || 0) - (a.attempts || 0);
    });

    return list;
  }, [activeUsers, activeUserSearch, activeUserSort]);

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-slate-500 dark:text-slate-300">
        <Loader2 className="animate-spin w-10 h-10 mb-4 text-emerald-500" />
        <p className="text-sm">Preparing your analytics…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-4 sm:py-8 lg:py-10 text-slate-900 dark:text-slate-50"
      aria-busy={refreshing ? "true" : "false"}
    >
      <Toast toast={toast} />

      {/* Full-width inside shell, no huge centre gap */}
      <main
        className="w-full space-y-6 sm:space-y-8 md:space-y-10"
        aria-label="Admin analytics dashboard"
      >
        {/* Header + Filters */}
        <div className="px-2 sm:px-4 md:px-6 lg:px-0 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-sky-500 flex items-center justify-center shadow-md shadow-emerald-500/40 text-lg">
                📈
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight">
                  Admin Dashboard
                </h1>
                <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>Last updated: {formattedLastUpdated}</span>
                  {refreshing && (
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Refreshing…
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <DatePickerField
                id="from-date"
                label="From"
                value={dateRange.from}
                onChange={(val) =>
                  setDateRange((prev) => ({ ...prev, from: val }))
                }
              />
              <DatePickerField
                id="to-date"
                label="To"
                value={dateRange.to}
                onChange={(val) =>
                  setDateRange((prev) => ({ ...prev, to: val }))
                }
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <button
                  onClick={() => handleQuickRange(1)}
                  className="text-[10px] sm:text-[11px] px-2.5 py-1.5 border border-emerald-500 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                >
                  Last 30d
                </button>
                <button
                  onClick={() => handleQuickRange(3)}
                  className="text-[10px] sm:text-[11px] px-2.5 py-1.5 border border-emerald-500 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                >
                  Last 3m
                </button>
                <button
                  onClick={() => handleQuickRange(6)}
                  className="text-[10px] sm:text-[11px] px-2.5 py-1.5 border border-emerald-500 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                >
                  Last 6m
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => fetchStats(false)}
                  disabled={refreshing}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-500 text-white text-xs sm:text-sm hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-emerald-500/40"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAutoRefresh((prev) => !prev)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm border transition-colors ${
                    autoRefresh
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 border-slate-200/80 dark:border-slate-700"
                  }`}
                  aria-pressed={autoRefresh}
                >
                  <Zap className="w-4 h-4" />
                  <span>Auto {autoRefresh ? "On" : "Off"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {coinStats && (
          <section
            aria-label="Overall platform summary"
            className="px-2 sm:px-4 md:px-6 lg:px-0 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
          >
            <SummaryCard label="Total Coins" value={coinStats.totalCoins} />
            <SummaryCard
              label="Average Coins / User"
              value={
                coinStats.avgCoins !== undefined
                  ? coinStats.avgCoins.toFixed
                    ? coinStats.avgCoins.toFixed(1)
                    : coinStats.avgCoins
                  : "-"
              }
            />
            <SummaryCard
              label="Active Users (period)"
              value={activeUsers.length}
            />
          </section>
        )}

        {/* Charts Row */}
        <div className="px-2 sm:px-4 md:px-6 lg:px-0 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* User Growth */}
          <SectionCard title="👥 User Growth (Monthly)">
            {userGrowth.length > 0 ? (
              <div className="h-52 sm:h-60 md:h-64 lg:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowth}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />
                    <XAxis
                      dataKey="month"
                      stroke={chartColors.axis}
                      tick={{ fontSize: 9 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis stroke={chartColors.axis} tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        backgroundColor: chartColors.tooltipBg,
                        borderRadius: "0.75rem",
                        border: `1px solid ${chartColors.tooltipBorder}`,
                      }}
                      labelStyle={{
                        color: darkMode ? "#e5e7eb" : "#0f172a",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke={chartColors.line}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-4">
                No user data for the selected range.
              </p>
            )}
          </SectionCard>

          {/* Quiz Participation */}
          <SectionCard title="🧩 Quiz Participation (Monthly)">
            {quizParticipation.length > 0 ? (
              <div className="h-52 sm:h-60 md:h-64 lg:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quizParticipation}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />
                    <XAxis
                      dataKey="month"
                      stroke={chartColors.axis}
                      tick={{ fontSize: 9 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis stroke={chartColors.axis} tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        backgroundColor: chartColors.tooltipBg,
                        borderRadius: "0.75rem",
                        border: `1px solid ${chartColors.tooltipBorder}`,
                      }}
                      labelStyle={{
                        color: darkMode ? "#e5e7eb" : "#0f172a",
                      }}
                    />
                    <Bar
                      dataKey="attempts"
                      fill={chartColors.bar}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-4">
                No quiz participation data for the selected range.
              </p>
            )}
          </SectionCard>
        </div>

        {/* Coin Distribution + Active Users */}
        <div className="px-2 sm:px-4 md:px-6 lg:px-0 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Coin Distribution Pie */}
          {coinStats && (
            <SectionCard title="💰 Top 10 Users by Coins">
              {coinStats.topUsers?.length > 0 ? (
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="w-full md:w-2/3 h-52 sm:h-60 md:h-64 lg:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={coinStats.topUsers}
                          dataKey="coins"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius="75%"
                          innerRadius="45%"
                          labelLine
                          // PC-Outside: simple percent label near arc, but short
                          label={({ percent }) =>
                            `${Math.round(percent * 100)}%`
                          }
                        >
                          {coinStats.topUsers.map((_, i) => (
                            <Cell
                              key={`${coinStats.topUsers[i]._id || coinStats.topUsers[i].email || coinStats.topUsers[i].name || "pie"}-${i}`}
                              fill={chartColors.pie[i % BASE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            fontSize: 11,
                            backgroundColor: chartColors.tooltipBg,
                            borderRadius: "0.75rem",
                            border: `1px solid ${chartColors.tooltipBorder}`,
                          }}
                          labelStyle={{
                            color: darkMode ? "#e5e7eb" : "#0f172a",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend with wrapped names (no internal scrollbars) */}
                  <div className="w-full md:w-1/3 space-y-2 text-[11px] sm:text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        Users
                      </span>
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
                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-100 bg-white/70 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Download className="w-3 h-3" />
                        CSV
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {coinStats.topUsers.map((u, i) => {
                        const total = coinStats.topUsers.reduce(
                          (acc, t) => acc + (t.coins || 0),
                          0
                        );
                        const pct =
                          total > 0
                            ? (((u.coins || 0) / total) * 100).toFixed(0)
                            : 0;
                        return (
                          <li
                            key={`${coinStats.topUsers[i]._id || coinStats.topUsers[i].email || coinStats.topUsers[i].name || "pie"}-${i}`}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    chartColors.pie[i % BASE_COLORS.length],
                                }}
                              />
                              <span
                                className="break-words max-w-[160px]"
                                title={u.name}
                              >
                                {u.name}
                              </span>
                            </div>
                            <span className="text-slate-700 dark:text-slate-200 whitespace-nowrap">
                              {u.coins}{" "}
                              <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                                ({pct}%)
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 mt-2 text-sm">
                  No coin distribution data available.
                </p>
              )}
            </SectionCard>
          )}

          {/* ======================= Most Active Users ======================= */}
          <SectionCard
            title="🔥 Most Active Users"
            subtitle={`Ranked by ${
              activeUserSort === "attempts" ? "quiz attempts" : "coins earned"
            }`}
            actions={
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
                className="flex items-center justify-center gap-1 text-[10px] sm:text-xs px-3 py-1.5 rounded-xl
                  border border-slate-200/80 dark:border-slate-700
                  text-slate-800 dark:text-slate-100
                  bg-white/80 dark:bg-slate-900/80
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  transition-colors shadow-sm"
              >
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            }
          >
            {/* Search + Sort Controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3 w-full">
              
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search by name or email"
                value={activeUserSearch}
                onChange={(e) => setActiveUserSearch(e.target.value)}
                className="w-full md:flex-1 min-w-[160px]
                  text-[11px] sm:text-xs md:text-sm
                  px-3 py-2 rounded-xl
                  border border-slate-200/80 dark:border-slate-700
                  bg-white/80 dark:bg-slate-900/80
                  text-slate-900 dark:text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  transition-shadow"
              />

              {/* Sort Select */}
              <select
                value={activeUserSort}
                onChange={(e) => setActiveUserSort(e.target.value)}
                className="w-full md:w-auto min-w-[150px]
                  text-[11px] sm:text-xs md:text-sm
                  px-3 py-2 rounded-xl
                  border border-slate-200/80 dark:border-slate-700
                  bg-white/80 dark:bg-slate-900/80
                  text-slate-900 dark:text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="attempts">Sort by Attempts</option>
                <option value="coins">Sort by Coins</option>
              </select>
            </div>

            {/* Data Table */}
            {filteredActiveUsers.length > 0 ? (
              <div className="overflow-x-auto px-1 sm:px-2 max-h-[300px] overflow-y-auto rounded-lg scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <table className="min-w-full text-[11px] sm:text-xs md:text-sm border-collapse">
                  <thead className="sticky top-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur z-10">
                    <tr className="border-b border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      <th className="py-2 px-3 text-left">#</th>
                      <th className="py-2 px-3 text-left">Name</th>
                      <th className="py-2 px-3 text-left hidden md:table-cell">Email</th>
                      <th className="py-2 px-3 text-center">Attempts</th>
                      <th className="py-2 px-3 text-center">Coins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActiveUsers.map((u, i) => (
                      <tr key={`${u._id || u.email || u.name || "active"}-${i}`}
                        className="border-b border-slate-100 dark:border-slate-800
                        hover:bg-emerald-50/60 dark:hover:bg-slate-800/60
                        transition-colors"
                      >
                        <td className="py-2 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                          {i + 1}
                        </td>
                        <td className="py-2 px-3 break-words max-w-[150px] sm:max-w-none">
                          {u.name}
                        </td>
                        <td className="py-2 px-3 hidden md:table-cell">
                          <span
                            className="truncate inline-block max-w-[200px]"
                            title={u.email}
                          >
                            {u.email}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">{u.attempts ?? 0}</td>
                        <td className="py-2 px-3 text-center">{u.coins ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 mt-4 text-sm">
                No activity data for the selected filters.
              </p>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
