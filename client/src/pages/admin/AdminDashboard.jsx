// src/pages/admin/AdminDashboard.jsx
import React,
{
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  Fragment,
} from "react";
import { useNavigate } from "react-router-dom";
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
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
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
    "fixed z-50 px-4 py-2 rounded-lg shadow-lg text-xs sm:text-sm font-medium animate-fade-in backdrop-blur-lg";
  const color =
    toast.type === "success"
      ? "bg-emerald-600/95 text-white"
      : toast.type === "error"
      ? "bg-rose-600/95 text-white"
      : "bg-amber-500/95 text-black";

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

function SummaryCard({ label, value, accent = "emerald", subLabel }) {
  const accentMap = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    red: "text-rose-600 dark:text-rose-400",
    blue: "text-sky-600 dark:text-sky-400",
    amber: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div
      className="bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-slate-800/70 
      rounded-2xl p-3 sm:p-5 text-left backdrop-blur-xl
      shadow-[0_18px_45px_rgba(15,23,42,0.18)]
      hover:shadow-[0_24px_60px_rgba(16,185,129,0.25)]
      hover:-translate-y-0.5 transition-all duration-300 animate-fade cursor-pointer"
    >
      <p className="text-slate-500 dark:text-slate-400 mb-1 text-[11px] sm:text-xs uppercase tracking-wide">
        {label}
      </p>
      <h2
        className={`text-xl sm:text-2xl md:text-3xl font-extrabold break-words ${accentMap[accent]}`}
      >
        {value ?? "-"}
      </h2>
      {subLabel && (
        <p className="mt-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
          {subLabel}
        </p>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, actions, children }) {
  return (
    <section
      className="bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-slate-800/70
      rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.16)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.7)]
      backdrop-blur-xl p-3 sm:p-5 flex flex-col gap-4"
    >
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let week = 0; week < 6; week++) {
    const row = [];
    for (let dow = 0; dow < 7; dow++) {
      const cellDate = new Date(year, month, currentDay);
      const inCurrent = cellDate.getMonth() === month;
      const iso = dateToISO(cellDate);
      const isSelected = selected && iso === selected;

      const cellClone = new Date(
        cellDate.getFullYear(),
        cellDate.getMonth(),
        cellDate.getDate()
      );
      const isFuture = cellClone > today;

      row.push({
        date: cellDate,
        inCurrent,
        iso,
        isSelected,
        isFuture,
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
        row.map((cell) => {
          const disabled = !cell.inCurrent || cell.isFuture;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelect(cell.date)}
              className={[
                "h-7 sm:h-8 rounded-full flex items-center justify-center transition-colors",
                disabled
                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : cell.isSelected
                  ? "bg-emerald-500 text-white font-semibold shadow-sm"
                  : "text-slate-900 dark:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-700/80",
              ].join(" ")}
            >
              {cell.date.getDate()}
            </button>
          );
        })
      )}
    </div>
  );
}

function DatePickerField({ label, value, onChange, id }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("date"); // "date" | "month" | "year"

  const initialDate = isoToDate(value) || new Date();
  const [viewMonth, setViewMonth] = useState(initialDate);

  const MIN_YEAR = 1900;
  const MAX_YEAR = 3000;
  const [yearPageStart, setYearPageStart] = useState(() => {
    const y = initialDate.getFullYear();
    const decadeStart = Math.floor(y / 10) * 10;
    return Math.min(Math.max(decadeStart, MIN_YEAR), MAX_YEAR - 9);
  });

  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setMode("date");
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (mode !== "year") {
      const y = viewMonth.getFullYear();
      const decadeStart = Math.floor(y / 10) * 10;
      setYearPageStart((prev) => {
        const next = Math.min(Math.max(decadeStart, MIN_YEAR), MAX_YEAR - 9);
        return next === prev ? prev : next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMonth, mode]);

  const handleSelectDate = (date) => {
    const iso = dateToISO(date);
    onChange(iso);
    setViewMonth(date);
    setOpen(false);
    setMode("date");
  };

  const display = value ? isoToDisplay(value) : "";

  const handlePrev = () => {
    if (mode === "year") {
      setYearPageStart((prev) => Math.max(MIN_YEAR, prev - 10));
    } else {
      const d = new Date(viewMonth);
      d.setMonth(d.getMonth() - 1);
      setViewMonth(d);
    }
  };

  const handleNext = () => {
    if (mode === "year") {
      setYearPageStart((prev) => Math.min(MAX_YEAR - 9, prev + 10));
    } else {
      const d = new Date(viewMonth);
      d.setMonth(d.getMonth() + 1);
      setViewMonth(d);
    }
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const monthLabel = MONTH_NAMES[viewMonth.getMonth()];
  const yearLabel = viewMonth.getFullYear();

  const canGoPrevYears = yearPageStart > MIN_YEAR;
  const canGoNextYears = yearPageStart + 9 < MAX_YEAR;

  const openPopover = () => {
    setMode("date");
    setOpen((p) => !p);
  };

  const handleMonthClick = (idx) => {
    const d = new Date(viewMonth);
    d.setMonth(idx);
    setViewMonth(d);
    setMode("date");
  };

  const handleYearClick = (year) => {
    if (year > currentYear) return;
    const d = new Date(viewMonth);
    d.setFullYear(year);
    setViewMonth(d);
    setMode("date");
  };

  const yearRange = Array.from({ length: 10 }, (_, i) => yearPageStart + i);

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
        onClick={openPopover}
        className="flex items-center justify-between gap-2 w-full rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 backdrop-blur-md"
      >
        <span className={display ? "" : "text-slate-400 dark:text-slate-500"}>
          {display || "dd-mm-yyyy"}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      </button>

      {open && (
        <div
          className="absolute z-40 top-full mt-2 right-0 sm:right-auto sm:left-0 w-72 rounded-2xl
          bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700
          shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/50
          p-3 sm:p-4 transform origin-top
          transition-all duration-150 ease-out scale-100 opacity-100 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-3 gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="px-3 py-2 rounded-xl bg-emerald-500 text-white 
              hover:bg-emerald-400 hover:shadow-md hover:-translate-y-[1px] 
              active:scale-95 transition-all duration-200"
            >
              ‹
            </button>

            <div
              className="flex-1 flex items-center justify-center gap-1.5
              rounded-full border border-slate-200/80 dark:border-slate-700
              bg-slate-50/80 dark:bg-slate-800/70 px-2 py-1"
            >
              <button
                type="button"
                onClick={() =>
                  setMode((prev) => (prev === "month" ? "date" : "month"))
                }
                className={[
                  "px-2 py-0.5 rounded-full text-[11px] sm:text-xs transition-colors",
                  mode === "month"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700",
                ].join(" ")}
              >
                {monthLabel.slice(0, 3)}
              </button>

              <button
                type="button"
                onClick={() =>
                  setMode((prev) => (prev === "year" ? "date" : "year"))
                }
                className={[
                  "px-2 py-0.5 rounded-full text-[11px] sm:text-xs transition-colors",
                  mode === "year"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700",
                ].join(" ")}
              >
                {yearLabel}
              </button>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="px-3 py-2 rounded-xl bg-emerald-500 text-white 
                hover:bg-emerald-400 hover:shadow-md hover:-translate-y-[1px] 
                active:scale-95 transition-all duration-200"
            >
              ›
            </button>
          </div>

          {mode === "date" && (
            <CalendarGrid
              monthDate={viewMonth}
              selected={value}
              onSelect={handleSelectDate}
            />
          )}

          {mode === "month" && (
            <div
              className="grid grid-cols-3 gap-2 text-[11px] sm:text-xs
              mt-1 pt-1
              transition-all duration-150 ease-out transform"
            >
              {MONTH_NAMES.map((m, idx) => {
                const isCurrentYear = viewMonth.getFullYear() === currentYear;
                const isFutureMonth =
                  isCurrentYear && idx > currentMonth;
                const isSelected = idx === viewMonth.getMonth();

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMonthClick(idx)}
                    className={[
                      "px-3 py-2 rounded-xl border text-center text-[11px] sm:text-xs transition-all duration-200",
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                      isFutureMonth ? "" : "",
                    ].join(" ")}
                  >
                    {m.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}

          {mode === "year" && (
            <div className="mt-1 pt-1 space-y-2">
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>
                  {yearPageStart} – {yearPageStart + 9}
                </span>
                <span className="italic">Future years disabled</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-[11px] sm:text-xs">
                {yearRange.map((yr) => {
                  const isSelected = yr === viewMonth.getFullYear();
                  const isFuture = yr > currentYear;
                  return (
                    <button
                      key={yr}
                      type="button"
                      disabled={isFuture}
                      onClick={() => handleYearClick(yr)}
                      className={[
                        "py-1 rounded-lg border text-center transition-colors",
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200",
                        isFuture
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-emerald-50 dark:hover:bg-slate-800/80",
                      ].join(" ")}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-1 px-1">
                <button
                  type="button"
                  onClick={() =>
                    canGoPrevYears &&
                    setYearPageStart((prev) => Math.max(MIN_YEAR, prev - 10))
                  }
                  disabled={!canGoPrevYears}
                  className={[
                    "text-[11px] px-2 py-1 rounded-full border",
                    "border-slate-200/80 dark:border-slate-700",
                    "text-slate-700 dark:text-slate-200",
                    canGoPrevYears
                      ? "hover:bg-slate-100 dark:hover:bg-slate-800"
                      : "opacity-40 cursor-not-allowed",
                  ].join(" ")}
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() =>
                    canGoNextYears &&
                    setYearPageStart((prev) =>
                      Math.min(MAX_YEAR - 9, prev + 10)
                    )
                  }
                  disabled={!canGoNextYears}
                  className={[
                    "text-[11px] px-2 py-1 rounded-full border",
                    "border-slate-200/80 dark:border-slate-700",
                    "text-slate-700 dark:text-slate-200",
                    canGoNextYears
                      ? "hover:bg-slate-100 dark:hover:bg-slate-800"
                      : "opacity-40 cursor-not-allowed",
                  ].join(" ")}
                >
                  ▶
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setViewMonth(new Date());
                setMode("date");
              }}
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
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const [userGrowth, setUserGrowth] = useState([]);
  const [quizParticipation, setQuizParticipation] = useState([]);
  const [coinStats, setCoinStats] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);

  const [overviewStats, setOverviewStats] = useState(null); // total users, blocked, pending

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [activeUserSearchInput, setActiveUserSearchInput] = useState("");
  const [activeUserSearch, setActiveUserSearch] = useState("");
  const [activeUserSort, setActiveUserSort] = useState("attempts");

  const isFirstLoad = useRef(true);

  const adminHeaders = useMemo(
    () => ({
      "X-Auth-Role": "admin",
    }),
    []
  );

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

  const buildParams = useCallback(() => {
    const params = {};
    if (dateRange.from) params.from = dateRange.from;
    if (dateRange.to) params.to = dateRange.to;
    return params;
  }, [dateRange.from, dateRange.to]);

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

  const [
          usersGrowthRes,
          quizzesRes,
          coinsRes,
          activesRes,
          usersRes,
          profileReqRes,
        ] = await Promise.all([
    api.get("/admin/stats/users-growth", { headers: adminHeaders, params }),
    api.get("/admin/stats/quiz-participation", { headers: adminHeaders, params }),
    api.get("/admin/stats/coins", { headers: adminHeaders }),
    api.get("/admin/stats/active-users", { headers: adminHeaders, params }),
    api.get("/users", { headers: adminHeaders }), // 🆕 Correct users list path
    api.get("/admin/profile-change-requests", {
      headers: adminHeaders,
      params: { status: "pending" },
    }),
  ]);

        setUserGrowth(usersGrowthRes.data || []);
        setQuizParticipation(quizzesRes.data || []);
        setCoinStats(coinsRes.data || null);
        setActiveUsers(activesRes.data || []);

        const usersList = usersRes.data || [];
        const blockedCount = usersList.filter((u) => u.isBlocked).length;
        const pendingRequests = (profileReqRes.data || []).length;

        setOverviewStats({
          totalUsers: usersList.length,
          blockedUsers: blockedCount,
          pendingProfileRequests: pendingRequests,
        });

        setLastUpdated(new Date());

        if (!isInitial) showToast("Dashboard data updated", "success");
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        showToast("Failed to load dashboard data", "error");
      } finally {
        if (isInitial) setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [adminHeaders, buildParams]
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

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(
      () => setActiveUserSearch(activeUserSearchInput),
      300
    );
    return () => clearTimeout(id);
  }, [activeUserSearchInput]);

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

  const sortOptions = [
    { value: "attempts", label: "Sort by Attempts" },
    { value: "coins", label: "Sort by Coins" },
  ];

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-700 dark:text-slate-200">
        <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-r from-emerald-500/40 via-emerald-300/30 to-emerald-500/40 animate-pulse flex items-center justify-center shadow-xl shadow-emerald-500/40">
          <Loader2 className="animate-spin w-8 h-8 text-emerald-700 dark:text-emerald-300" />
        </div>
        <p className="text-sm mb-6 opacity-80">Preparing your analytics…</p>
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-emerald-300/10 to-emerald-500/20 animate-pulse backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.25)]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-4 sm:py-8 lg:py-10 text-slate-900 dark:text-slate-50"
      aria-busy={refreshing ? "true" : "false"}
    >
      <Toast toast={toast} />

      <main
        className="w-full space-y-6 sm:space-y-8 md:space-y-10 max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-0"
        aria-label="Admin analytics dashboard"
      >
        {/* Header + Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-sky-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 text-lg">
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
                  className="text-[10px] sm:text-[11px] px-2.5 py-1.5 border border-emerald-500/70 rounded-full text-emerald-700 dark:text-emerald-300 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 transition-colors"
                >
                  Last 30d
                </button>
                <button
                  onClick={() => handleQuickRange(3)}
                  className="text-[10px] sm:text-[11px] px-2.5 py-1.5 border border-emerald-500/70 rounded-full text-emerald-700 dark:text-emerald-300 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 transition-colors"
                >
                  Last 3m
                </button>
                <button
                  onClick={() => handleQuickRange(6)}
                  className="text-[10px] sm:text-[11px] px-2.5 py-1.5 border border-emerald-500/70 rounded-full text-emerald-700 dark:text-emerald-300 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 transition-colors"
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
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm border transition-colors backdrop-blur-md ${
                    autoRefresh
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/40"
                      : "bg-white/70 dark:bg-slate-900/70 text-slate-900 dark:text-slate-100 border-slate-200/80 dark:border-slate-700"
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

        {/* Quick Admin Shortcuts */}
        <SectionCard
          title="🚀 Quick Admin Shortcuts"
          subtitle="Jump directly to the most important moderation & management screens."
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className="flex flex-col items-start gap-1 px-3 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md hover:-translate-y-[1px] transition-all text-left text-xs sm:text-sm"
            >
              <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Users
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-50">
                Manage Users
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Block / reward / delete learners
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/users?filter=blocked")}
              className="flex flex-col items-start gap-1 px-3 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md hover:-translate-y-[1px] transition-all text-left text-xs sm:text-sm"
            >
              <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Status
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-50">
                Blocked Users
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Review accounts restricted by admins
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/profile-requests")}
              className="flex flex-col items-start gap-1 px-3 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md hover:-translate-y-[1px] transition-all text-left text-xs sm:text-sm"
            >
              <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Identity
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-50">
                Profile Requests
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Approve name / email corrections
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/logs")}
              className="flex flex-col items-start gap-1 px-3 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md hover:-translate-y-[1px] transition-all text-left text-xs sm:text-sm"
            >
              <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Security
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-50">
                Admin Logs
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Audit all admin actions in one place
              </span>
            </button>
          </div>
        </SectionCard>

        {/* Summary Cards */}
        {(overviewStats || coinStats) && (
          <section
            aria-label="Overall platform summary"
            className="bg-white/30 dark:bg-slate-900/30 border border-white/40 dark:border-slate-800 rounded-2xl 
            shadow-[0_18px_45px_rgba(15,23,42,0.16)] hover:shadow-emerald-500/15 transition-all duration-300 animate-fade backdrop-blur-xl p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <SummaryCard
              label="Total Users"
              value={overviewStats?.totalUsers ?? "-"}
              accent="blue"
              subLabel="Non-admin learners registered"
            />
            <SummaryCard
              label="Blocked Users"
              value={overviewStats?.blockedUsers ?? 0}
              accent="red"
              subLabel="Currently restricted accounts"
            />
            <SummaryCard
              label="Pending Profile Requests"
              value={overviewStats?.pendingProfileRequests ?? 0}
              accent="amber"
              subLabel="Awaiting admin review"
            />
            <SummaryCard
              label="Total Coins Issued"
              value={coinStats?.totalCoins ?? 0}
              accent="emerald"
              subLabel={`Avg per user: ${
                coinStats?.avgCoins != null
                  ? coinStats.avgCoins.toFixed
                    ? coinStats.avgCoins.toFixed(1)
                    : coinStats.avgCoins
                  : "-"
              }`}
            />
          </section>
        )}

        {/* Charts Row (User Growth & Quiz) – hidden if dataset empty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {userGrowth.length > 0 && (
            <SectionCard
              title="👥 User Growth (Monthly)"
              actions={
                userGrowth.length > 0 && (
                  <button
                    onClick={() => exportToCSV("user-growth.csv", userGrowth)}
                    className="px-3 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-md hover:-translate-y-[1px] active:scale-95 transition-all duration-200 flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <Download className="w-3 h-3" />
                    CSV
                  </button>
                )
              }
            >
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
            </SectionCard>
          )}

          {quizParticipation.length > 0 && (
            <SectionCard
              title="🧩 Quiz Participation (Monthly)"
              actions={
                quizParticipation.length > 0 && (
                  <button
                    onClick={() =>
                      exportToCSV(
                        "quiz-participation.csv",
                        quizParticipation
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-md hover:-translate-y-[1px] active:scale-95 transition-all duration-200 flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <Download className="w-3 h-3" />
                    CSV
                  </button>
                )
              }
            >
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
            </SectionCard>
          )}
        </div>

        {/* Coin Distribution + Active Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Coin Distribution Pie – hide completely if no top users */}
          {coinStats && coinStats.topUsers?.length > 0 && (
            <SectionCard
              title="💰 Top 10 Users by Coins"
              actions={
                coinStats.topUsers?.length > 0 && (
                  <button
                    onClick={() =>
                      exportToCSV(
                        "top-coins-users.csv",
                        coinStats.topUsers.map((u, idx) => ({
                          rank: idx + 1,
                          name: u.name,
                          email: u.email,
                          coins: u.coins,
                        }))
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-md hover:-translate-y-[1px] active:scale-95 transition-all duration-200 flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <Download className="w-3 h-3" />
                    CSV
                  </button>
                )
              }
            >
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
                        label={({ percent }) =>
                          `${Math.round(percent * 100)}%`
                        }
                      >
                        {coinStats.topUsers.map((_, i) => (
                          <Cell
                            key={`coin-user-${i}`}
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

                <div className="w-full md:w-1/3 space-y-2 text-[11px] sm:text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                      Users
                    </span>
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
                          key={`coin-legend-${i}`}
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
            </SectionCard>
          )}

          {/* Most Active Users – keep visible even if empty (table) */}
          <SectionCard
            title="🔥 Most Active Users"
            subtitle={`Ranked by ${
              activeUserSort === "attempts" ? "quiz attempts" : "coins earned"
            }`}
            actions={
              filteredActiveUsers.length > 0 && (
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
                  className="px-3 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-md hover:-translate-y-[1px] active:scale-95 transition-all duration-200 flex items-center gap-1 text-xs sm:text-sm"
                >
                  <Download className="w-3 h-3" />
                  CSV
                </button>
              )
            }
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3 w-full">
              <input
                type="text"
                placeholder="Search by name or email"
                value={activeUserSearchInput}
                onChange={(e) => setActiveUserSearchInput(e.target.value)}
                className="w-full md:flex-1 min-w-[160px]
                  text-[11px] sm:text-xs md:text-sm
                  px-3 py-2 rounded-xl
                  border border-slate-200/80 dark:border-slate-700
                  bg-white/80 dark:bg-slate-900/80
                  text-slate-900 dark:text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  transition-shadow backdrop-blur-md"
              />

              <Listbox value={activeUserSort} onChange={setActiveUserSort}>
                <div className="relative">
                  <Listbox.Button
                    className="
                      w-full md:w-auto min-w-[160px]
                      px-3 py-2 text-[11px] sm:text-xs md:text-sm font-semibold
                      rounded-xl
                      bg-white/95 dark:bg-slate-900/85
                      border border-emerald-500/30 dark:border-emerald-500/30
                      text-slate-900 dark:text-slate-100
                      shadow-sm hover:shadow-md transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-emerald-500
                      flex items-center justify-between backdrop-blur-md
                    "
                  >
                    {sortOptions.find((x) => x.value === activeUserSort)
                      ?.label}
                    <ChevronDown className="w-4 h-4 ml-2 text-emerald-500" />
                  </Listbox.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-150"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Listbox.Options
                      className="
                        absolute z-20 mt-2
                        w-full md:w-auto min-w-[160px]
                        bg-white/95 dark:bg-slate-900/95
                        border border-slate-700/40
                        rounded-xl shadow-2xl overflow-hidden backdrop-blur-2xl
                      "
                    >
                      {sortOptions.map((item) => (
                        <Listbox.Option
                          key={item.value}
                          value={item.value}
                          className={({ active }) =>
                            `
                              cursor-pointer select-none px-3 py-2
                              text-[11px] sm:text-xs md:text-sm font-medium
                              flex items-center justify-between
                              ${
                                active
                                  ? "bg-emerald-600 text-white"
                                  : "text-slate-900 dark:text-slate-100"
                              }
                            `
                          }
                        >
                          {({ selected }) => (
                            <>
                              {item.label}
                              {selected && (
                                <Check className="w-4 h-4 text-white ml-2" />
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {filteredActiveUsers.length > 0 ? (
              <div className="overflow-x-auto px-1 sm:px-2 max-h-[300px] overflow-y-auto rounded-lg scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <table className="min-w-full text-[11px] sm:text-xs md:text-sm border-collapse">
                  <thead className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-10">
                    <tr
                      className="border-b border-slate-100 dark:border-slate-800 
                      transition-all duration-200 hover:bg-emerald-50/60 dark:hover:bg-slate-800/60 
                      hover:-translate-y-[1px]"
                    >
                      <th className="py-2 px-3 text-left">#</th>
                      <th className="py-2 px-3 text-left">Name</th>
                      <th className="py-2 px-3 text-left hidden md:table-cell">
                        Email
                      </th>
                      <th className="py-2 px-3 text-center">Attempts</th>
                      <th className="py-2 px-3 text-center">Coins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActiveUsers.map((u, i) => (
                      <tr
                        key={`${u._id || u.email || u.name || "active"}-${i}`}
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
                        <td className="py-2 px-3 text-center">
                          {u.attempts ?? 0}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {u.coins ?? 0}
                        </td>
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
