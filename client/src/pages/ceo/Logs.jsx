// src/pages/ceo/Logs.jsx
import React, { useEffect, useState } from "react";
import {
  Filter,
  Search,
  Download,
  ArrowUpDown,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import api from "../../utils/api";

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "ROLE_UPDATE", label: "Role update" },
  { value: "CONTENT_APPROVAL", label: "Content approval" },
  { value: "PROFILE_UPDATE_REQUEST", label: "Profile update request" },
  { value: "USER_MANAGEMENT", label: "User management" },
  { value: "COMMUNITY_ACTION", label: "Community action" },
  { value: "WALLET_ACTION", label: "Wallet action" },
  { value: "REWARD_ACTION", label: "Reward action" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "roles", label: "Roles / hierarchy" },
  { value: "quiz", label: "Quiz / learning" },
  { value: "resources", label: "Resources / store" },
  { value: "wallet", label: "Wallet / coins" },
  { value: "community", label: "Community / forum" },
  { value: "system", label: "System / maintenance" },
];

const SORT_OPTIONS = [
  { value: "desc", label: "Newest first" },
  { value: "asc", label: "Oldest first" },
];

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
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [category, setCategory] = useState("");
  const [actor, setActor] = useState(""); // email or id
  const [target, setTarget] = useState(""); // email or id
  const [ip, setIp] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // apply-filters button trigger
  const [filterVersion, setFilterVersion] = useState(0);

  const applyFilters = () => {
    setPage(1);
    setFilterVersion((v) => v + 1);
  };

  const resetFilters = () => {
    setSearch("");
    setAction("");
    setCategory("");
    setActor("");
    setTarget("");
    setIp("");
    setFrom("");
    setTo("");
    setSort("desc");
    setPage(1);
    setFilterVersion((v) => v + 1);
  };

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          page,
          limit,
          sort,
        };

        if (search.trim()) params.search = search.trim();
        if (action) params.action = action;
        if (category) params.category = category;
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
          err.response?.data?.message ||
            "Unable to load logs. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterVersion, page, limit, sort]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = {};

      if (search.trim()) params.search = search.trim();
      if (action) params.action = action;
      if (category) params.category = category;
      if (actor.trim()) params.actor = actor.trim();
      if (target.trim()) params.target = target.trim();
      if (ip.trim()) params.ip = ip.trim();
      if (from) params.from = from;
      if (to) params.to = to;
      if (sort) params.sort = sort;

      const res = await api.get("/logs/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timeStamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
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

  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.totalPages;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Logs & Security
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Centralized view of all critical actions across the platform.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm shadow-sm shadow-emerald-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
          <Filter className="w-4 h-4" />
          Filters
        </div>

        <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-6">
          {/* Search */}
          <div className="md:col-span-2 lg:col-span-2">
            <label className="text-xs text-slate-500 block mb-1">
              Search
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Action, details, IP..."
                className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action */}
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Action
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actor */}
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Actor (email / id)
            </label>
            <input
              type="text"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="Admin / CEO / staff"
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Target */}
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Target (email / id)
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Affected user"
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* IP */}
          <div>
            <label className="text-xs text-slate-500 block mb-1">IP</label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g. 192.168.x.x"
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Date From */}
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              From date
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="text-xs text-slate-500 block mb-1">To date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Sort by date
            </label>
            <div className="relative">
              <ArrowUpDown className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filter actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing page <span className="font-semibold">{meta.page}</span> of{" "}
            <span className="font-semibold">{meta.totalPages}</span> —{" "}
            <span className="font-semibold">{meta.total}</span> records
          </p>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <XCircle className="w-4 h-4" />
              Clear
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-teal-500 hover:bg-teal-600 text-white text-xs shadow-sm shadow-teal-500/40"
            >
              <Filter className="w-4 h-4" />
              Apply filters
            </button>
          </div>
        </div>
      </section>

      {/* Table / Results */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm p-3 sm:p-4 shadow-sm">
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center text-sm text-slate-500 dark:text-slate-400 gap-2">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading logs…</span>
          </div>
        ) : error ? (
          <div className="py-8 flex flex-col items-center justify-center text-sm text-rose-500 gap-2">
            <span>{error}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No logs found for the current filters.
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/60">
                    <th className="px-3 py-2 text-left whitespace-nowrap">
                      Time
                    </th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">
                      Action
                    </th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">
                      Category
                    </th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">
                      Actor
                    </th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">
                      Target
                    </th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">
                      IP
                    </th>
                    <th className="px-3 py-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-900/70 transition-colors"
                    >
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap font-medium">
                        {log.action || "-"}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {log.category || "-"}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {log.actor?.email || log.actor?.name || "-"}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {log.target?.email || log.target?.name || "-"}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {log.ip || "-"}
                      </td>
                      <td className="px-3 py-2 align-top text-xs">
                        {log.details
                          ? JSON.stringify(log.details)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Showing page {meta.page} of {meta.totalPages}
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
    </div>
  );
}
