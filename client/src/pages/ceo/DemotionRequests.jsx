// src/pages/ceo/DemotionRequests.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import {
  Loader2,
  Filter,
  Search,
  User,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ROLES } from "../../config/roles";

const STATUS_META = {
  PENDING_USER_REVIEW: {
    label: "Pending user review",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-200",
    border: "border-amber-200 dark:border-amber-700",
  },
  USER_ACCEPTED: {
    label: "User accepted",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-200",
    border: "border-emerald-200 dark:border-emerald-700",
  },
  USER_DISPUTED: {
    label: "User disputed",
    bg: "bg-rose-50 dark:bg-rose-900/25",
    text: "text-rose-700 dark:text-rose-200",
    border: "border-rose-200 dark:border-rose-700",
  },
  FINALIZED: {
    label: "Finalized",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    text: "text-sky-700 dark:text-sky-200",
    border: "border-sky-200 dark:border-sky-700",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    text: "text-slate-600 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
  },
};

const ROLE_LABELS = {
  [ROLES.CEO]: "CEO",
  [ROLES.ADMIN]: "Admin",
  [ROLES.INSTRUCTOR]: "Instructor",
  [ROLES.MODERATOR]: "Moderator",
  [ROLES.STUDENT]: "Student",
};

const STATUS_FILTER_OPTIONS = [
  "ALL",
  "PENDING_USER_REVIEW",
  "USER_ACCEPTED",
  "USER_DISPUTED",
  "FINALIZED",
  "CANCELLED",
];

export default function DemotionRequests() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [actionId, setActionId] = useState(null); // which card is being finalized/cancelled

  const loadRequests = async () => {
    try {
      setStatus("loading");
      setError(null);

      const res = await api.get("/demotion"); // backend: GET /api/demotion
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setRequests(list);
      setStatus("idle");
    } catch (err) {
      console.error("Failed to load demotion requests:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch demotion requests from server."
      );
      setStatus("error");
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // filter by status
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;

      // filter by target role
      if (roleFilter !== "all" && r.newRole !== roleFilter) return false;

      // filter by search name/email
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const name = r.user?.name?.toLowerCase() || "";
        const email = r.user?.email?.toLowerCase() || "";
        if (!name.includes(q) && !email.includes(q)) return false;
      }

      return true;
    });
  }, [requests, statusFilter, roleFilter, search]);

  const handleFinalize = async (reqItem) => {
    const ok = window.confirm(
      `Finalize demotion for "${reqItem.user?.name || reqItem.user?.email}"?\nThis will change their role to "${ROLE_LABELS[reqItem.newRole] || reqItem.newRole}".`
    );
    if (!ok) return;

    try {
      setActionId(reqItem._id);
      await api.patch(`/demotion/${reqItem._id}/finalize`);
      await loadRequests();
    } catch (err) {
      console.error("Finalize demotion error:", err);
      alert(err.response?.data?.message || "Failed to finalize demotion.");
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (reqItem) => {
    const ok = window.confirm(
      `Cancel demotion request for "${reqItem.user?.name || reqItem.user?.email}"?`
    );
    if (!ok) return;

    try {
      setActionId(reqItem._id);
      await api.patch(`/demotion/${reqItem._id}/cancel`);
      await loadRequests();
    } catch (err) {
      console.error("Cancel demotion error:", err);
      alert(err.response?.data?.message || "Failed to cancel demotion.");
    } finally {
      setActionId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Demotion Requests
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Track and finalize role demotions. Each request goes through{" "}
            <span className="font-medium">
              initiation → user response → final decision
            </span>{" "}
            with a clear, auditable history.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            {/* Status filter */}
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-xs sm:text-sm text-slate-900 dark:text-slate-100 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {STATUS_FILTER_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "ALL"
                      ? "All statuses"
                      : STATUS_META[s]?.label || s}
                  </option>
                ))}
              </select>
            </div>

            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-xs sm:text-sm text-slate-900 dark:text-slate-100 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All target roles</option>
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.INSTRUCTOR}>Instructor</option>
              <option value={ROLES.MODERATOR}>Moderator</option>
              <option value={ROLES.STUDENT}>Student</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 text-xs sm:text-sm px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
        <p>
          Demotions are{" "}
          <span className="font-medium">two-step</span>: the user first
          receives a request and can accept or dispute. Only after your final
          confirmation is their role actually changed.
        </p>
      </div>

      {/* Content */}
      <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm shadow-slate-900/5 dark:shadow-slate-900/50">
        {/* Header row */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <User className="w-4 h-4 text-emerald-500" />
            {status === "loading"
              ? "Loading demotion requests..."
              : `${filteredRequests.length} request${
                  filteredRequests.length !== 1 ? "s" : ""
                } in view`}
          </div>
          <button
            type="button"
            onClick={loadRequests}
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs rounded-full border border-slate-200/80 dark:border-slate-700 px-2.5 py-1 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Loader2 className="w-3 h-3 text-emerald-500" />
            Refresh
          </button>
        </div>

        <div className="p-3 sm:p-4">
          {status === "loading" ? (
            <div className="flex items-center justify-center py-10 text-slate-500 dark:text-slate-400 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading demotion workflow…
            </div>
          ) : status === "error" ? (
            <div className="py-10 text-center text-sm text-rose-500">
              {error || "Error loading demotion data."}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No demotion requests match the current filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req, idx) => (
                <DemotionCard
                  key={req._id}
                  req={req}
                  index={idx}
                  expanded={expandedId === req._id}
                  onToggleExpand={() => toggleExpand(req._id)}
                  onFinalize={handleFinalize}
                  onCancel={handleCancel}
                  actionId={actionId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Single Demotion Request Card
 * with floating timeline cards (Style C)
 */
function DemotionCard({
  req,
  index,
  expanded,
  onToggleExpand,
  onFinalize,
  onCancel,
  actionId,
}) {
  const meta = STATUS_META[req.status] || STATUS_META.PENDING_USER_REVIEW;

  const createdAt = req.createdAt ? new Date(req.createdAt) : null;
  const updatedAt = req.updatedAt ? new Date(req.updatedAt) : null;

  const canFinalize =
    ["USER_ACCEPTED", "USER_DISPUTED"].includes(req.status) &&
    req.status !== "FINALIZED" &&
    req.status !== "CANCELLED";

  const canCancel =
    ["PENDING_USER_REVIEW", "USER_ACCEPTED", "USER_DISPUTED"].includes(
      req.status
    ) && req.status !== "CANCELLED" && req.status !== "FINALIZED";

  const isBusy = actionId === req._id;

  // Timeline step completion
  const step1Done = true; // Initiated is always done
  const step2Done = ["USER_ACCEPTED", "USER_DISPUTED", "FINALIZED", "CANCELLED"].includes(
    req.status
  );
  const step3Done = ["FINALIZED", "CANCELLED"].includes(req.status);

  return (
    <div
      className={`rounded-2xl border ${meta.border} bg-white/90 dark:bg-slate-950/80 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-[2px]`}
      style={{ transitionDelay: `${index * 30}ms` }}
    >
      {/* Top row */}
      <div className="px-4 sm:px-5 pt-4 pb-3 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 font-medium text-slate-900 dark:text-slate-50">
              <User className="w-4 h-4 text-emerald-500" />
              {req.user?.name || req.user?.email || "Unknown user"}
            </span>
            {req.user?.email && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 break-all">
                {req.user.email}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100">
              From:{" "}
              <strong>
                {ROLE_LABELS[req.currentRole] || req.currentRole}
              </strong>
            </span>
            <ArrowDownRight className="w-3 h-3 text-rose-500" />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200">
              To:{" "}
              <strong>{ROLE_LABELS[req.newRole] || req.newRole}</strong>
            </span>
          </div>
        </div>

        {/* Status + actions */}
        <div className="flex flex-col items-start md:items-end gap-2 text-xs sm:text-sm">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${meta.border} ${meta.bg} ${meta.text}`}
          >
            {req.status === "FINALIZED" && (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            {req.status === "USER_DISPUTED" && (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            {req.status === "CANCELLED" && (
              <XCircle className="w-3.5 h-3.5" />
            )}
            <span className="font-medium">
              {meta.label || req.status}
            </span>
          </span>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {createdAt && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                Created: {createdAt.toLocaleDateString()}{" "}
                {createdAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {updatedAt && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                Last update: {updatedAt.toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-1">
            {canCancel && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onCancel(req)}
                className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60"
              >
                Cancel
              </button>
            )}
            {canFinalize && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onFinalize(req)}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-[11px] sm:text-xs text-white font-medium shadow-sm shadow-rose-500/40 transition disabled:opacity-60"
              >
                {isBusy && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Finalize
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Animated timeline (floating cards) */}
      <div className="px-4 sm:px-5 pb-3 sm:pb-4 pt-1">
        <div className="relative flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Vertical / horizontal connector line */}
          <div className="absolute left-[10px] top-4 bottom-4 md:left-1/2 md:-translate-x-1/2 md:top-5 md:bottom-5 border-l md:border-l-0 md:border-t border-dashed border-slate-300 dark:border-slate-700 pointer-events-none" />

          <TimelineStep
            title="Initiated"
            description="Demotion created by CEO/Admin with reason."
            icon={<ArrowDownRight className="w-4 h-4" />}
            active
            done={step1Done}
            align="left"
          />

          <TimelineStep
            title="User response"
            description={
              req.status === "USER_DISPUTED"
                ? "User has disputed this demotion."
                : req.status === "USER_ACCEPTED"
                ? "User has accepted this demotion."
                : "Waiting for the user to accept or dispute."
            }
            icon={<User className="w-4 h-4" />}
            done={step2Done}
            align="center"
            highlight={req.status === "USER_DISPUTED"}
          />

          <TimelineStep
            title="Final decision"
            description={
              req.status === "FINALIZED"
                ? "Demotion finalized and role updated."
                : req.status === "CANCELLED"
                ? "Demotion request cancelled."
                : "You can finalize or cancel once user responds."
            }
            icon={<CheckCircle2 className="w-4 h-4" />}
            done={step3Done}
            align="right"
          />
        </div>

        {/* Expandable reason / dispute details */}
        <button
          type="button"
          onClick={onToggleExpand}
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              View reason & notes
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 space-y-2">
            {req.reason && (
              <div>
                <p className="font-semibold mb-0.5 text-slate-800 dark:text-slate-100">
                  Demotion reason
                </p>
                <p className="whitespace-pre-wrap">{req.reason}</p>
              </div>
            )}
            {req.userResponse === "disputed" && req.disputeNote && (
              <div>
                <p className="font-semibold mb-0.5 text-rose-600 dark:text-rose-300">
                  User dispute
                </p>
                <p className="whitespace-pre-wrap">{req.disputeNote}</p>
              </div>
            )}
            {req.userResponse === "accepted" && (
              <p className="text-emerald-600 dark:text-emerald-300">
                User has explicitly accepted this demotion.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineStep({
  title,
  description,
  icon,
  done,
  active = false,
  align = "left", // left | center | right
  highlight = false,
}) {
  const baseAlign =
    align === "center"
      ? "md:self-center"
      : align === "right"
      ? "md:self-end"
      : "md:self-start";

  const stateClasses = done
    ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-900/30"
    : highlight
    ? "border-rose-200 dark:border-rose-700 bg-rose-50/80 dark:bg-rose-900/30"
    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900";

  const dotClasses = done
    ? "bg-emerald-500 border-emerald-500"
    : highlight
    ? "bg-rose-500 border-rose-500"
    : "bg-slate-300 dark:bg-slate-600 border-slate-400 dark:border-slate-600";

  return (
    <div
      className={`relative pl-6 md:pl-0 ${baseAlign} transition-transform duration-300`}
    >
      {/* Connector dot */}
      <span
        className={`absolute left-0 md:left-1/2 md:-translate-x-1/2 top-3 w-2.5 h-2.5 rounded-full border-2 ${dotClasses} shadow-sm`}
      />

      {/* Floating card */}
      <div
        className={`ml-3 md:ml-0 w-full max-w-xs sm:max-w-sm rounded-2xl border ${stateClasses} shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-[2px]`}
      >
        <div className="px-3.5 py-3 flex items-start gap-2.5">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
              done
                ? "bg-emerald-500 text-white"
                : highlight
                ? "bg-rose-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            }`}
          >
            {icon}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
