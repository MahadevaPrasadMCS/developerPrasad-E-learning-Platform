// src/pages/ceo/Logs.jsx
import React, { useEffect, useState } from "react";
import {
  Filter,
  Search,
  Download,
  RefreshCcw,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import api from "../../utils/api";

const ACTION_OPTIONS = [
  { value: "", label: "All important actions" },
  { value: "ROLE_UPDATE", label: "Role update" },
  { value: "PROMOTION_REQUEST", label: "Promotion request" },
  { value: "PROMOTION_APPROVED", label: "Promotion approved" },
  { value: "PROMOTION_REJECTED", label: "Promotion rejected" },
  { value: "WALLET_ACTION", label: "Wallet action" },
  { value: "QUIZ_ACTION", label: "Quiz action" },
  { value: "RESOURCE_UPLOAD", label: "Resource upload" },
  { value: "SECURITY_ALERT", label: "Security alert" },
];

const SORT_OPTIONS = [
  { value: "desc", label: "Newest first" },
  { value: "asc", label: "Oldest first" },
];

const actionStyles = {
  SECURITY_ALERT: "bg-red-600/15 text-red-600 dark:text-red-300",
  ROLE_UPDATE: "bg-blue-600/15 text-blue-600 dark:text-blue-300",
  WALLET_ACTION: "bg-amber-600/15 text-amber-600 dark:text-amber-300",
  QUIZ_ACTION: "bg-purple-600/15 text-purple-600 dark:text-purple-300",
  RESOURCE_UPLOAD: "bg-cyan-600/15 text-cyan-600 dark:text-cyan-300",
  PROMOTION_REQUEST: "bg-slate-600/15 text-slate-600 dark:text-slate-300",
  PROMOTION_APPROVED:
    "bg-emerald-600/15 text-emerald-600 dark:text-emerald-300",
  PROMOTION_REJECTED: "bg-rose-600/15 text-rose-600 dark:text-rose-300",
  default: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

const roleStyles = {
  CEO: "bg-emerald-600/15 text-emerald-600 dark:text-emerald-300",
  ADMIN: "bg-blue-600/15 text-blue-600 dark:text-blue-300",
  MODERATOR: "bg-yellow-600/15 text-yellow-600 dark:text-yellow-300",
  INSTRUCTOR: "bg-purple-600/15 text-purple-600 dark:text-purple-300",
  SYSTEM: "bg-slate-600/15 text-slate-600 dark:text-slate-300",
  default: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [target, setTarget] = useState("");
  const [ip, setIp] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateRange, setDateRange] = useState(""); // "", "7d", "30d", "custom"
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [expandedId, setExpandedId] = useState(null);

  // Filter drawer
  const [showFilters, setShowFilters] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);
  const [dragTranslateY, setDragTranslateY] = useState(0);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = showFilters ? "hidden" : "auto";
  }, [showFilters]);

  const filterCount =
    (search ? 1 : 0) +
    (action ? 1 : 0) +
    (actor ? 1 : 0) +
    (target ? 1 : 0) +
    (ip ? 1 : 0) +
    (from || to ? 1 : 0);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit,
        sort,
      };

      if (search) params.search = search;
      if (action) params.action = action;
      if (actor.trim()) params.actor = actor.trim();
      if (target.trim()) params.target = target.trim();
      if (ip.trim()) params.ip = ip.trim();
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await api.get("/logs", { params });

      const { logs: items, page: p, totalPages, total } = res.data || {};

      setLogs(items || []);
      setMeta({
        page: p || 1,
        totalPages: totalPages || 1,
        total: total || (items ? items.length : 0),
      });
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError(
        err.response?.data?.message || "Unable to load logs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, action, search, actor, target, ip, from, to]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = {};

      if (search) params.search = search;
      if (action) params.action = action;
      if (actor.trim()) params.actor = actor.trim();
      if (target.trim()) params.target = target.trim();
      if (ip.trim()) params.ip = ip.trim();
      if (from) params.from = from;
      if (to) params.to = to;
      if (sort) params.sort = sort;

      params.export = "csv";

      const res = await api.get("/logs", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timeStamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      link.setAttribute("download", `youlearnhub-logs-${timeStamp}.csv`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export logs.");
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setAction("");
    setActor("");
    setTarget("");
    setIp("");
    setFrom("");
    setTo("");
    setDateRange("");
    setSort("desc");
    setPage(1);
  };

  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.totalPages;

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const applyQuickRange = (type) => {
    const today = new Date();
    const toStr = today.toISOString().slice(0, 10);
    const base = new Date();
    if (type === "7d") {
      base.setDate(today.getDate() - 6);
    } else if (type === "30d") {
      base.setDate(today.getDate() - 29);
    } else {
      setFrom("");
      setTo("");
      setDateRange("");
      return;
    }
    const fromStr = base.toISOString().slice(0, 10);
    setFrom(fromStr);
    setTo(toStr);
    setDateRange(type);
  };

  const handleDrawerApply = () => {
    setSearch(searchInput.trim());
    setPage(1);
    setShowFilters(false);
  };

  // Touch gesture handlers for drawer
  const handleTouchStart = (e) => {
    setDragStartY(e.touches[0].clientY);
    setDragTranslateY(0);
  };

  const handleTouchMove = (e) => {
    if (dragStartY == null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - dragStartY;
    if (delta > 0) {
      setDragTranslateY(Math.min(delta, 200));
    }
  };

  const handleTouchEnd = () => {
    if (dragTranslateY > 80) {
      setShowFilters(false);
    }
    setDragStartY(null);
    setDragTranslateY(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight dark:text-white">
            Security & Governance Logs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            High-impact actions performed by admins, moderators, and staff — excluding routine activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters Button */}
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Filter className="w-4 h-4" />
            Filters
            {filterCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-500 text-white rounded-full">
                {filterCount}
              </span>
            )}
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset
          </button>

          {/* Export */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm shadow-sm shadow-emerald-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Filter Summary Chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        {filterCount === 0 ? (
          <span className="text-slate-500 dark:text-slate-400">
            No filters applied.
          </span>
        ) : (
          <>
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <span>Search: {search}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {action && (
              <button
                onClick={() => {
                  setAction("");
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <span>
                  Action:{" "}
                  {ACTION_OPTIONS.find((a) => a.value === action)?.label ||
                    action}
                </span>
                <X className="w-3 h-3" />
              </button>
            )}
            {actor && (
              <button
                onClick={() => {
                  setActor("");
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <span>Actor: {actor}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {target && (
              <button
                onClick={() => {
                  setTarget("");
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <span>Target: {target}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {ip && (
              <button
                onClick={() => {
                  setIp("");
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <span>IP: {ip}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {(from || to) && (
              <button
                onClick={() => {
                  setFrom("");
                  setTo("");
                  setDateRange("");
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <span>
                  Date: {from || "…"} → {to || "…"}
                </span>
                <X className="w-3 h-3" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Results: Card Layout */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm p-4 shadow-sm">
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center text-sm text-slate-500 dark:text-slate-400 gap-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading logs…</span>
          </div>
        ) : error ? (
          <div className="py-8 flex flex-col items-center justify-center text-sm text-rose-500 gap-2">
            <span>{error}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No important logs for the current filters.
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {logs.map((log) => {
                const isAlert = log.action === "SECURITY_ALERT";
                const isExpanded = expandedId === log._id;
                const actorRole =
                  log.actorRole || log.actor?.role || "SYSTEM";

                const actionClass =
                  actionStyles[log.action] || actionStyles.default;
                const roleClass =
                  roleStyles[actorRole?.toUpperCase()] || roleStyles.default;

                return (
                  <div
                    key={log._id}
                    className={`relative rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col gap-2.5 bg-white/95 dark:bg-slate-950/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      isAlert
                        ? "ring-1 ring-red-500/40 bg-red-50/50 dark:bg-red-950/30"
                        : ""
                    }`}
                  >
                    {/* Top row: action + time */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${actionClass}`}
                        >
                          {isAlert ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                          {log.action || "UNKNOWN"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>

                    {/* Actor / Target row */}
                    <div className="flex flex-col gap-1.5 text-xs text-slate-700 dark:text-slate-200">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            Actor:{" "}
                            {log.actor?.name || log.actor?.email || "System"}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {log.actor?.email || "-"}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${roleClass}`}
                        >
                          {actorRole}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            Target:{" "}
                            {log.target?.name || log.target?.email || "—"}
                          </p>
                          {log.ip && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              IP: {log.ip}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details toggle */}
                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(log._id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                        {isExpanded ? "Hide details" : "View details"}
                      </button>

                      {isAlert && (
                        <span className="text-[11px] font-semibold text-red-600 dark:text-red-300">
                          Security alert
                        </span>
                      )}
                    </div>

                    {/* Expanded JSON details */}
                    {isExpanded && (
                      <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-2 max-h-48 overflow-auto text-[11px] text-slate-700 dark:text-slate-200">
                        <pre className="whitespace-pre-wrap break-words">
                          {log.details
                            ? JSON.stringify(log.details, null, 2)
                            : "No additional details."}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Showing page {meta.page} of {meta.totalPages} —{" "}
                {meta.total} records
              </span>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  disabled={!canPrev}
                  onClick={() => canPrev && setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => canNext && setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Filters Bottom Drawer */}
      {showFilters && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => setShowFilters(false)}
          />

          {/* Drawer */}
          <div
            className="fixed bottom-0 left-0 w-full max-h-[75vh] rounded-t-3xl border-t 
            border-slate-300 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 
            backdrop-blur-xl p-5 z-[70] shadow-lg animate-slide-up overflow-auto"
            style={{ transform: `translateY(${dragTranslateY}px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Notch */}
            <div className="flex justify-center mb-3">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            <h3 className="text-lg font-semibold mb-4">Filters</h3>

            {/* Search */}
            <label className="text-xs text-slate-500 block mb-1">Search</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Actor, target, details…"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 
              dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 mb-4 text-sm"
            />

            {/* Quick Actions chips */}
            <label className="text-xs text-slate-500 block mb-1">
              Quick actions
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {ACTION_OPTIONS.filter((a) => a.value).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setAction((prev) => (prev === opt.value ? "" : opt.value))
                  }
                  className={`px-3 py-1 rounded-full text-xs border ${
                    action === opt.value
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Action dropdown (fine control) */}
            <label className="text-xs text-slate-500 block mb-1">
              Action type (detailed)
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 
              dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 mb-4 text-sm"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Date Range */}
            <label className="text-xs text-slate-500 block mb-1">
              Date range
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => applyQuickRange("7d")}
                className={`px-3 py-1 rounded-full text-xs border ${
                  dateRange === "7d"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                Last 7 days
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange("30d")}
                className={`px-3 py-1 rounded-full text-xs border ${
                  dateRange === "30d"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                Last 30 days
              </button>
              <button
                type="button"
                onClick={() => applyQuickRange("")}
                className="px-3 py-1 rounded-full text-xs border bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                Clear date
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setDateRange(e.target.value || to ? "custom" : "");
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setDateRange(from || e.target.value ? "custom" : "");
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-sm"
                />
              </div>
            </div>

            {/* Actor / Target / IP */}
            <label className="text-xs text-slate-500 block mb-1">
              Actor (email / id)
            </label>
            <input
              type="text"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="Admin / moderator / staff"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 
              dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 mb-3 text-sm"
            />

            <label className="text-xs text-slate-500 block mb-1">
              Target (email / id)
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Affected user"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 
              dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 mb-3 text-sm"
            />

            <label className="text-xs text-slate-500 block mb-1">IP</label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g. 192.168.x.x"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 
              dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 mb-4 text-sm"
            />

            {/* Buttons */}
            <div className="flex justify-between gap-3 mt-2">
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-2 rounded-full border border-slate-300 
                dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-xs sm:text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleDrawerApply}
                className="flex-1 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 
                text-white text-xs sm:text-sm shadow-sm shadow-emerald-500/40"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      <style>
        {`
          .animate-slide-up {
            animation: slideUp 0.3s ease forwards;
          }

          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0%);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}
