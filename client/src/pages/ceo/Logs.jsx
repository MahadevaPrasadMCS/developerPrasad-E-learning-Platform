import React, { useEffect, useState } from "react";
import {
  Filter,
  Search,
  RefreshCcw,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import api from "../../utils/api";

const ACTION_OPTIONS = [
  { value: "", label: "All" },
  { value: "ROLE_UPDATE", label: "Role updates" },
  { value: "PROMOTION_REQUEST", label: "Promotion requests" },
  { value: "PROMOTION_APPROVED", label: "Promotion approval" },
  { value: "PROMOTION_REJECTED", label: "Promotion rejected" },
  { value: "WALLET_ACTION", label: "Wallet actions" },
  { value: "QUIZ_ACTION", label: "Quiz actions" },
  { value: "RESOURCE_UPLOAD", label: "Resource uploads" },
  { value: "SECURITY_ALERT", label: "Security alerts" },
];

const formatDate = (v) =>
  v ? new Date(v).toLocaleString() : "-";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [expanded, setExpanded] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sort: "desc" };
      if (action) params.action = action;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/logs", { params });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Failed:", err);
    }
    setLoading(false);
  };

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [page, search, action]);

  const toggleDetails = (id) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Security Logs</h2>

        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white flex gap-1 items-center text-sm"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg p-3 rounded-xl shadow-sm border border-slate-200/60">
        <div className="flex-1">
          <label className="text-xs text-slate-500 block mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search details, IP, names..."
              className="w-full pl-7 pr-2 py-1.5 rounded-lg border bg-white dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-xs block mb-1">Action</label>
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="px-2 py-1.5 rounded-lg border bg-white dark:bg-slate-900 dark:text-white"
          >
            {ACTION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setAction("");
            setSearch("");
            setSearchInput("");
            setPage(1);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm"
        >
          <Filter size={14} /> Reset
        </button>
      </div>

      {/* Table */}
      <div className="p-3 rounded-xl border bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg shadow-sm">
        {loading ? (
          <p className="text-center text-sm p-5">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-sm text-slate-500 p-5">
            No important logs at this time.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-xs uppercase text-slate-500">
                <th className="py-2 px-2">Time</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isAlert = log.action === "SECURITY_ALERT";
                const open = expanded === log._id;

                return (
                  <React.Fragment key={log._id}>
                    <tr
                      className={`border-b hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                        isAlert ? "bg-red-50 dark:bg-red-900/20" : ""
                      }`}
                    >
                      <td className="px-2 py-2 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-2 font-medium">{log.action}</td>
                      <td>{log.actor?.name || "-"}</td>
                      <td>{log.target?.name || "-"}</td>

                      <td>
                        <button
                          onClick={() => toggleDetails(log._id)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                        >
                          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          Details
                        </button>
                      </td>
                    </tr>

                    {open && (
                      <tr className="bg-slate-50 dark:bg-slate-800">
                        <td colSpan="5" className="p-3 text-xs">
                          <pre className="overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="flex justify-between text-xs mt-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded-md border disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-md border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
