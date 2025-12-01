import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import {
  Users,
  Filter,
  RefreshCw,
  CalendarClock,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Video,
  User,
} from "lucide-react";
import { ROLES } from "../../config/roles";

// Status → label + color (Style A)
const STATUS_META = {
  pending: {
    label: "Pending",
    chip: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  under_review: {
    label: "Under Review",
    chip: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  interview_scheduled: {
    label: "Interview Scheduled",
    chip: "bg-purple-100 text-purple-800 border border-purple-200",
  },
  interview_completed: {
    label: "Interview Completed",
    chip: "bg-teal-100 text-teal-800 border border-teal-200",
  },
  awaiting_user_confirmation: {
    label: "Awaiting User Confirmation",
    chip: "bg-sky-100 text-sky-800 border border-sky-200",
  },
  approved: {
    label: "Approved",
    chip: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    chip: "bg-rose-100 text-rose-800 border border-rose-200",
  },
  disputed: {
    label: "Disputed",
    chip: "bg-slate-100 text-slate-800 border border-slate-200",
  },
};

const ROLE_LABELS = {
  [ROLES.STUDENT]: "Student",
  [ROLES.INSTRUCTOR]: "Instructor",
  [ROLES.MODERATOR]: "Moderator",
  [ROLES.ADMIN]: "Admin",
  [ROLES.CEO]: "CEO",
};

function formatDate(dt) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "-";
  }
}

function RolePromotion() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Interview modal state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: "",
    mode: "online",
    meetingLink: "",
    location: "",
    notes: "",
  });

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/promotions"); // backend: GET /api/promotions
      setRequests(Array.isArray(res.data) ? res.data : res.data.requests || []);
    } catch (err) {
      console.error("Failed to load promotions:", err);
      setError(
        err.response?.data?.message || "Failed to load promotion requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const openInterviewModal = (req) => {
    setActiveRequest(req);
    setInterviewForm({
      scheduledAt: req.interview?.scheduledAt
        ? new Date(req.interview.scheduledAt).toISOString().slice(0, 16)
        : "",
      mode: req.interview?.mode || "online",
      meetingLink: req.interview?.meetingLink || "",
      location: req.interview?.location || "",
      notes: req.interview?.notes || "",
    });
    setShowInterviewModal(true);
  };

  const closeInterviewModal = () => {
    setShowInterviewModal(false);
    setActiveRequest(null);
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!activeRequest) return;

    try {
      setActionLoadingId(activeRequest._id);
      const payload = {
        ...interviewForm,
        scheduledAt: interviewForm.scheduledAt || null,
      };
      await api.patch(`/promotions/${activeRequest._id}/interview`, payload);
      await loadRequests();
      closeInterviewModal();
    } catch (err) {
      console.error("Schedule interview error:", err);
      alert(
        err.response?.data?.message || "Failed to schedule/update interview"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkCompleted = async (req) => {
    if (
      !window.confirm(
        "Mark this interview as completed? This should be done only after the interview actually happened."
      )
    )
      return;

    try {
      setActionLoadingId(req._id);
      await api.patch(`/promotions/${req._id}/interview-complete`);
      await loadRequests();
    } catch (err) {
      console.error("Complete interview error:", err);
      alert(
        err.response?.data?.message || "Failed to mark interview as completed"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApprove = async (req) => {
    const reason =
      window.prompt(
        `Approve promotion to ${ROLE_LABELS[req.requestedRole]}?\n(Optional) Add a note:`
      ) || "Promotion approved";

    try {
      setActionLoadingId(req._id);
      await api.patch(`/promotions/${req._id}/approve`, { reason });
      await loadRequests();
    } catch (err) {
      console.error("Approve promotion error:", err);
      alert(err.response?.data?.message || "Failed to approve promotion");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (req) => {
    const confirmed = window.confirm(
      "Reject this promotion request? The user will enter cooldown."
    );
    if (!confirmed) return;

    const reason =
      window.prompt("Reason for rejection (visible to user):") ||
      "Promotion not approved";

    try {
      setActionLoadingId(req._id);
      await api.patch(`/promotions/${req._id}/reject`, { reason });
      await loadRequests();
    } catch (err) {
      console.error("Reject promotion error:", err);
      alert(err.response?.data?.message || "Failed to reject promotion");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered list for UI
  const filteredRequests = requests.filter((r) => {
    const matchStatus = statusFilter ? r.status === statusFilter : true;
    const matchRole = roleFilter ? r.requestedRole === roleFilter : true;
    return matchStatus && matchRole;
  });

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50">
            Role Promotion Queue
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review promotion requests, ensure interviews happened, and finalize
            role changes with full traceability.
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 sm:px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <Filter className="w-4 h-4" />
          <span>Filter queue</span>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-start sm:justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="">All Target Roles</option>
            <option value={ROLES.INSTRUCTOR}>Instructor</option>
            <option value={ROLES.MODERATOR}>Moderator</option>
            <option value={ROLES.ADMIN}>Admin</option>
          </select>
        </div>
      </div>

      {/* Error / Empty / Table */}
      {error && (
        <div className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 rounded-xl px-4 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Loading promotion requests…
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white/60 dark:bg-slate-900/60">
          <Users className="w-8 h-8 mb-2" />
          <p className="font-medium text-sm">No promotion requests yet</p>
          <p className="text-xs mt-1 max-w-sm">
            Once learners or team members start requesting role upgrades, their
            full history will appear here for your decision.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 shadow-sm overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/80">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Current → Requested</th>
                  <th className="px-4 py-3">Interview</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const meta = STATUS_META[req.status] || STATUS_META.pending;
                  const interview = req.interview || {};
                  const iConfirm = interview.confirmedByUser;

                  return (
                    <tr
                      key={req._id}
                      className="border-t border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/70 dark:hover:bg-slate-900/70"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-slate-50">
                            {req.user?.name || "Unknown User"}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {req.user?.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-xs">
                          <div className="font-medium">
                            {ROLE_LABELS[req.currentRole]}{" "}
                            <span className="text-slate-400">→</span>{" "}
                            {ROLE_LABELS[req.requestedRole]}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Current: {ROLE_LABELS[req.user?.role]}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="inline-flex items-center gap-1.5">
                            <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                            <span className="truncate max-w-[150px]">
                              {interview.scheduledAt
                                ? formatDate(interview.scheduledAt)
                                : "Not scheduled"}
                            </span>
                          </div>
                          {interview.mode && (
                            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                              {interview.mode === "online" ? (
                                <Video className="w-3.5 h-3.5" />
                              ) : (
                                <PhoneCall className="w-3.5 h-3.5" />
                              )}
                              <span className="capitalize">
                                {interview.mode}
                              </span>
                            </div>
                          )}
                          {iConfirm && (
                            <span
                              className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border ${
                                iConfirm === "yes"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : iConfirm === "no"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              <User className="w-3 h-3" />
                              User: {iConfirm === "pending" ? "Not confirmed" : iConfirm}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${meta.chip}`}
                        >
                          {meta.label}
                        </span>
                        {req.cooldownEndsAt && req.status === "rejected" && (
                          <div className="mt-1 text-[11px] text-slate-500">
                            Next request: {formatDate(req.cooldownEndsAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-slate-600 dark:text-slate-400">
                        {formatDate(req.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col items-end gap-1.5 text-xs">
                          <button
                            onClick={() => openInterviewModal(req)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                            <span>Interview</span>
                          </button>

                          {req.status === "interview_scheduled" && (
                            <button
                              onClick={() => handleMarkCompleted(req)}
                              disabled={actionLoadingId === req._id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-60"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {actionLoadingId === req._id
                                  ? "Updating…"
                                  : "Mark Completed"}
                              </span>
                            </button>
                          )}

                          {["interview_completed", "awaiting_user_confirmation"].includes(
                            req.status
                          ) && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleApprove(req)}
                                disabled={actionLoadingId === req._id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-60"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>
                                  {actionLoadingId === req._id
                                    ? "Approving…"
                                    : "Approve"}
                                </span>
                              </button>
                              <button
                                onClick={() => handleReject(req)}
                                disabled={actionLoadingId === req._id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-60"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>
                                  {actionLoadingId === req._id
                                    ? "Rejecting…"
                                    : "Reject"}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {filteredRequests.map((req) => {
              const meta = STATUS_META[req.status] || STATUS_META.pending;
              const interview = req.interview || {};
              const iConfirm = interview.confirmedByUser;

              return (
                <div
                  key={req._id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-300 text-xs">
                          <Users className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {req.user?.name || "Unknown User"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {req.user?.email}
                          </p>
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {ROLE_LABELS[req.currentRole]} →{" "}
                        <span className="font-medium">
                          {ROLE_LABELS[req.requestedRole]}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium ${meta.chip}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="inline-flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>
                        {interview.scheduledAt
                          ? formatDate(interview.scheduledAt)
                          : "No interview scheduled"}
                      </span>
                    </div>
                    {interview.mode && (
                      <div className="inline-flex items-center gap-1.5">
                        {interview.mode === "online" ? (
                          <Video className="w-3.5 h-3.5" />
                        ) : (
                          <PhoneCall className="w-3.5 h-3.5" />
                        )}
                        <span className="capitalize">{interview.mode}</span>
                      </div>
                    )}
                    <div>Requested: {formatDate(req.createdAt)}</div>
                    {req.cooldownEndsAt && req.status === "rejected" && (
                      <div>
                        Next request: {formatDate(req.cooldownEndsAt)}
                      </div>
                    )}
                    {iConfirm && (
                      <div
                        className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 border ${
                          iConfirm === "yes"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : iConfirm === "no"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        <User className="w-3 h-3" />
                        <span>User: {iConfirm}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <button
                      onClick={() => openInterviewModal(req)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-xs"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      Interview
                    </button>

                    {req.status === "interview_scheduled" && (
                      <button
                        onClick={() => handleMarkCompleted(req)}
                        disabled={actionLoadingId === req._id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {actionLoadingId === req._id
                          ? "Updating…"
                          : "Mark Completed"}
                      </button>
                    )}

                    {["interview_completed", "awaiting_user_confirmation"].includes(
                      req.status
                    ) && (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={actionLoadingId === req._id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {actionLoadingId === req._id
                            ? "Approving…"
                            : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          disabled={actionLoadingId === req._id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs disabled:opacity-60"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {actionLoadingId === req._id
                            ? "Rejecting…"
                            : "Reject"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xl">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
              Schedule Interview
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3">
              {activeRequest.user?.name} —{" "}
              {ROLE_LABELS[activeRequest.currentRole]} →{" "}
              {ROLE_LABELS[activeRequest.requestedRole]}
            </p>

            <form onSubmit={handleScheduleInterview} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={interviewForm.scheduledAt}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      scheduledAt: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs sm:text-sm"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Mode
                  </label>
                  <select
                    value={interviewForm.mode}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        mode: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs sm:text-sm"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              {interviewForm.mode === "online" ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Meeting Link
                  </label>
                  <input
                    type="text"
                    value={interviewForm.meetingLink}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        meetingLink: e.target.value,
                      }))
                    }
                    placeholder="https://meet..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs sm:text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    value={interviewForm.location}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Conference room / Office"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs sm:text-sm"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={interviewForm.notes}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Agenda, expectations, panel details…"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeInterviewModal}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === activeRequest._id}
                  className="px-3 sm:px-4 py-1.5 rounded-full bg-teal-500 hover:bg-teal-600 text-white text-xs sm:text-sm disabled:opacity-60"
                >
                  {actionLoadingId === activeRequest._id
                    ? "Saving…"
                    : "Save Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolePromotion;
