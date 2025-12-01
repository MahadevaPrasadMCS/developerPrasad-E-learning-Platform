// src/pages/ceo/ManageRoles.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  Shield,
  UserCog,
  AlertTriangle,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
} from "lucide-react";
import api from "../../utils/api";
import { ROLES } from "../../config/roles";

const ROLE_LADDER = [
  ROLES.STUDENT,
  ROLES.MODERATOR,
  ROLES.INSTRUCTOR,
  ROLES.ADMIN,
];

const ROLE_LABELS = {
  [ROLES.CEO]: "CEO",
  [ROLES.ADMIN]: "Admin",
  [ROLES.INSTRUCTOR]: "Instructor",
  [ROLES.MODERATOR]: "Moderator",
  [ROLES.STUDENT]: "Student",
};

function getNextStepRoles(role) {
  const idx = ROLE_LADDER.indexOf(role);
  if (idx === -1) return [];
  const possible = [];
  if (idx > 0) possible.push(ROLE_LADDER[idx - 1]); // demote
  if (idx < ROLE_LADDER.length - 1) possible.push(ROLE_LADDER[idx + 1]); // promote
  return possible;
}

function getMoveType(currentRole, targetRole) {
  const currentIdx = ROLE_LADDER.indexOf(currentRole);
  const targetIdx = ROLE_LADDER.indexOf(targetRole);
  if (currentIdx === -1 || targetIdx === -1) return "neutral";
  if (targetIdx > currentIdx) return "promotion";
  if (targetIdx < currentIdx) return "demotion";
  return "neutral";
}

// Small helper to display demotion status in UI
function getDemotionBadge(demotion) {
  if (!demotion) return null;

  const base = {
    label: "Demotion active",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200/70 dark:border-amber-700/70",
  };

  switch (demotion.status) {
    case "PENDING_USER_REVIEW":
      return {
        ...base,
        label: "Demotion pending (awaiting user)",
      };
    case "USER_ACCEPTED":
      return {
        ...base,
        label: "Demotion accepted (finalize pending)",
        className:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 border-emerald-200/70 dark:border-emerald-700/70",
    };
    case "USER_DISPUTED":
      return {
        label: "Demotion disputed",
        className:
          "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200 border-rose-200/70 dark:border-rose-700/70",
      };
    default:
      return base;
  }
}

export default function ManageRoles() {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState(null);

  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [changingId, setChangingId] = useState(null);

  // Demotion modal state
  const [demoteTarget, setDemoteTarget] = useState(null);
  const [demoteRole, setDemoteRole] = useState(null);
  const [demoteReason, setDemoteReason] = useState("");
  const [demoteSubmitting, setDemoteSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      setStatus("loading");
      setError(null);

      const params = { page };
      if (roleFilter !== "all") params.role = roleFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/ceo/users", { params });

      setUsers(res.data?.users || []);
      setPagination(res.data?.pagination || null);
      setStatus("idle");
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(err.response?.data?.message || "Failed to fetch users.");
      setStatus("error");
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, page]);

  const filteredUsers = useMemo(() => users, [users]);

  const handleSoftRefresh = () => {
    // reset to first page and reload with current filters + search
    setPage(1);
    loadUsers();
  };

  const openDemotionModal = (user, newRole) => {
    setDemoteTarget(user);
    setDemoteRole(newRole);
    setDemoteReason("");
  };

  const closeDemotionModal = () => {
    setDemoteTarget(null);
    setDemoteRole(null);
    setDemoteReason("");
    setDemoteSubmitting(false);
  };

  const submitDemotion = async () => {
    if (!demoteTarget || !demoteRole) return;
    if (!demoteReason || demoteReason.trim().length < 10) {
      alert("Please provide a clear reason (at least 10 characters).");
      return;
    }

    try {
      setDemoteSubmitting(true);
      await api.post("/demotion", {
        userId: demoteTarget._id,
        newRole: demoteRole,
        reason: demoteReason.trim(),
      });
      alert("Demotion request created and sent to the user.");
      closeDemotionModal();
      await loadUsers();
    } catch (err) {
      console.error("Demotion initiation error:", err);
      alert(err.response?.data?.message || "Failed to create demotion request.");
      setDemoteSubmitting(false);
    }
  };

  const handleChangeRole = async (user, newRole) => {
    if (!newRole || newRole === user.role) return;

    // If demotion is active, block any role changes from this screen
    if (user.demotion) {
      alert(
        "There is an active demotion workflow for this user. Please resolve it first in Demotion Requests."
      );
      return;
    }

    const moveType = getMoveType(user.role, newRole);
    const currentLabel = ROLE_LABELS[user.role] || user.role;
    const targetLabel = ROLE_LABELS[newRole] || newRole;

    if (moveType === "demotion") {
      // Use demotion workflow (with user acknowledgement)
      openDemotionModal(user, newRole);
      return;
    }

    // Promotion: direct role update using existing CEO role route
    const ok = window.confirm(
      `Are you sure you want to promote "${user.name}" from ${currentLabel} → ${targetLabel}?`
    );
    if (!ok) return;

    try {
      setChangingId(user._id);
      await api.patch(`/ceo/roles/${user._id}/role`, { newRole });
      await loadUsers();
    } catch (err) {
      console.error("Role change error:", err);
      alert(err.response?.data?.message || "Failed to update role.");
    } finally {
      setChangingId(null);
    }
  };

  const canGoPrev = pagination && pagination.page > 1;
  const canGoNext = pagination && pagination.page < pagination.pages;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Manage Roles
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            Adjust roles along the ladder{" "}
            <span className="font-medium">
              (Student → Moderator → Instructor → Admin)
            </span>
            . CEO role is locked and cannot be changed here. Demotions go
            through a review flow with user acknowledgement.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  handleSoftRefresh();
                }
              }}
              onBlur={() => {
                if (search.trim() !== "") {
                  setPage(1);
                  handleSoftRefresh();
                }
              }}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All roles</option>
            <option value={ROLES.CEO}>CEO</option>
            <option value={ROLES.ADMIN}>Admin</option>
            <option value={ROLES.INSTRUCTOR}>Instructor</option>
            <option value={ROLES.MODERATOR}>Moderator</option>
            <option value={ROLES.STUDENT}>Student</option>
          </select>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 text-xs sm:text-sm px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          Role changes update permissions and invalidate existing sessions.
          Users will be logged out and must log in again with their new role.{" "}
          <span className="font-medium">
            Demotions are first sent to the user for acknowledgement and can be
            disputed.
          </span>
        </p>
      </div>

      {/* Table card */}
      <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm shadow-slate-900/5 dark:shadow-slate-900/50">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <Shield className="w-4 h-4 text-emerald-500" />
            {status === "loading"
              ? "Loading users..."
              : `${filteredUsers.length} user${
                  filteredUsers.length !== 1 ? "s" : ""
                } on this page`}
            {pagination && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                • Page {pagination.page} of {pagination.pages} • Total{" "}
                {pagination.total}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSoftRefresh}
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs rounded-full border border-slate-200/80 dark:border-slate-700 px-2.5 py-1 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <UserCog className="w-3 h-3 text-emerald-500" />
            Refresh
          </button>
        </div>

        <div className="p-3 sm:p-4">
          {status === "loading" ? (
            <div className="flex items-center justify-center py-10 text-slate-500 dark:text-slate-400 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading user roles…
            </div>
          ) : status === "error" ? (
            <div className="py-10 text-center text-sm text-rose-500">
              {error || "Error loading users."}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No users match the current filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="min-w-[840px] w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-900/60">
                      <th className="px-3 sm:px-4 py-2 font-semibold">
                        User
                      </th>
                      <th className="px-3 sm:px-4 py-2 font-semibold">
                        Current Role
                      </th>
                      <th className="px-3 sm:px-4 py-2 font-semibold">
                        Coins
                      </th>
                      <th className="px-3 sm:px-4 py-2 font-semibold">
                        Joined
                      </th>
                      <th className="px-3 sm:px-4 py-2 font-semibold text-right">
                        Change Role
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const ladderOptions = getNextStepRoles(u.role);
                      const isCEO = u.role === ROLES.CEO;
                      const demotionBadge = getDemotionBadge(u.demotion);
                      const hasActiveDemotion = Boolean(u.demotion);

                      return (
                        <tr
                          key={u._id}
                          className="border-b border-slate-100 dark:border-slate-800/70 hover:bg-slate-50/70 dark:hover:bg-slate-900/60 transition-colors"
                        >
                          <td className="px-3 sm:px-4 py-3 align-top">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-slate-900 dark:text-slate-50 text-sm">
                                {u.name || "-"}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 break-all">
                                {u.email || "—"}
                              </span>

                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {u.isBlocked && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-200">
                                    Blocked
                                  </span>
                                )}

                                {demotionBadge && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${demotionBadge.className}`}
                                  >
                                    <Info className="w-3 h-3" />
                                    {demotionBadge.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-3 sm:px-4 py-3 align-top text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                              {ROLE_LABELS[u.role] || u.role || "—"}
                            </span>
                          </td>

                          <td className="px-3 sm:px-4 py-3 align-top text-xs text-slate-600 dark:text-slate-300">
                            {typeof u.coins === "number" ? u.coins : "—"}
                          </td>

                          <td className="px-3 sm:px-4 py-3 align-top text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString()
                              : "—"}
                          </td>

                          <td className="px-3 sm:px-4 py-3 align-top text-right">
                            {isCEO ? (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                CEO role locked
                              </span>
                            ) : ladderOptions.length === 0 ? (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                No moves available
                              </span>
                            ) : hasActiveDemotion ? (
                              <span className="text-[11px] text-amber-600 dark:text-amber-300">
                                Demotion workflow active
                              </span>
                            ) : (
                              <select
                                disabled={changingId === u._id}
                                defaultValue=""
                                onChange={(e) =>
                                  handleChangeRole(u, e.target.value)
                                }
                                className="text-[11px] sm:text-xs rounded-full border border-emerald-500/70 bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                              >
                                <option value="" disabled>
                                  {changingId === u._id
                                    ? "Updating…"
                                    : "Select move"}
                                </option>
                                {ladderOptions.map((role) => {
                                  const moveType = getMoveType(u.role, role);
                                  const label =
                                    moveType === "promotion"
                                      ? `Promote → ${
                                          ROLE_LABELS[role] || role
                                        }`
                                      : `Demote → ${
                                          ROLE_LABELS[role] || role
                                        }`;
                                  return (
                                    <option key={role} value={role}>
                                      {label}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
                  <div className="text-slate-500 dark:text-slate-400">
                    Showing page{" "}
                    <span className="font-semibold">
                      {pagination.page}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold">
                      {pagination.pages}
                    </span>{" "}
                    • Total{" "}
                    <span className="font-semibold">
                      {pagination.total}
                    </span>{" "}
                    users
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      disabled={!canGoPrev}
                      onClick={() => canGoPrev && setPage((p) => p - 1)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={!canGoNext}
                      onClick={() => canGoNext && setPage((p) => p + 1)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Demotion Modal */}
      {demoteTarget && demoteRole && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <ArrowDownRight className="w-5 h-5 text-rose-500" />
                  Confirm Demotion
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  You&apos;re about to create a{" "}
                  <span className="font-medium text-rose-500">
                    demotion request
                  </span>{" "}
                  for{" "}
                  <span className="font-semibold">
                    {demoteTarget.name || demoteTarget.email}
                  </span>
                  . The user will be notified and can accept or dispute this
                  change before it is finalized.
                </p>
              </div>
              <button
                onClick={closeDemotionModal}
                className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100">
                  <span className="font-medium">Current:</span>
                  {ROLE_LABELS[demoteTarget.role] || demoteTarget.role}
                </span>
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200">
                  <span className="font-medium">New:</span>
                  {ROLE_LABELS[demoteRole] || demoteRole}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                  Reason for demotion
                </label>
                <textarea
                  rows={3}
                  value={demoteReason}
                  onChange={(e) => setDemoteReason(e.target.value)}
                  placeholder="Explain clearly why this demotion is necessary. This text may be shown to the user."
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Minimum 10 characters. Keep it respectful and factual — this
                  helps avoid disputes.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={closeDemotionModal}
                disabled={demoteSubmitting}
                className="inline-flex justify-center items-center px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDemotion}
                disabled={demoteSubmitting}
                className="inline-flex justify-center items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-xs sm:text-sm text-white font-medium shadow-md shadow-rose-500/30 transition disabled:opacity-60"
              >
                {demoteSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Create Demotion Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
