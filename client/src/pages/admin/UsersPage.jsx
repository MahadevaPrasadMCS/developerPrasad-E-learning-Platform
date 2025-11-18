// src/pages/admin/UsersPage.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import {
  Loader2,
  Plus,
  Minus,
  Ban,
  Unlock,
  Trash2,
  Eye,
} from "lucide-react";

function UsersPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [blockTarget, setBlockTarget] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [processingBlock, setProcessingBlock] = useState(false);

  const [viewTarget, setViewTarget] = useState(null);

  // Admin header (if you also send auth token via api instance)
  const adminHeaders = useMemo(
    () => ({ "X-Auth-Role": "admin" }),
    []
  );

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/users", { headers: adminHeaders });
      const filtered = (res.data || []).filter((u) => u.role !== "admin");
      setUsers(filtered);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      showToast("❌ Failed to fetch users.", "error");
    } finally {
      setLoading(false);
    }
  }, [adminHeaders]);

  useEffect(() => {
    if (user?.role === "admin") fetchUsers();
  }, [user, fetchUsers]);

  const handleCoinUpdate = async (id, change) => {
    try {
      const res = await api.patch(
        `/users/coins/${id}`,
        { change },
        { headers: adminHeaders }
      );
      showToast(
        res.data.message || "✅ Coins updated successfully.",
        "success"
      );
      fetchUsers();
    } catch (err) {
      console.error("Coin update failed:", err);
      showToast("❌ Failed to update coins.", "error");
    }
  };

  const openBlockModal = (u) => {
    setBlockTarget(u);
    setBlockReason(u.blockReason || "");
  };

  const submitBlockToggle = async () => {
    if (!blockTarget) return;

    const isBlocking = !blockTarget.isBlocked;

    if (isBlocking && !blockReason.trim()) {
      showToast("Please provide a reason before blocking.", "error");
      return;
    }

    try {
      setProcessingBlock(true);
      const res = await api.patch(
        `/users/block/${blockTarget._id}`,
        { reason: blockReason.trim() },
        { headers: adminHeaders }
      );
      showToast(
        res.data.message || "✅ User status updated.",
        "success"
      );
      setBlockTarget(null);
      setBlockReason("");
      fetchUsers();
    } catch (err) {
      console.error("Block/unblock failed:", err);
      showToast("❌ Failed to update user status.", "error");
    } finally {
      setProcessingBlock(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/users/${deleteTarget._id}`, {
        headers: adminHeaders,
      });
      showToast(res.data.message || "✅ User deleted.", "success");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      console.error("Delete user failed:", err);
      showToast("❌ Failed to delete user.", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-center text-red-500 font-semibold">
          Access denied — Admins only.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-4 sm:px-6 lg:px-8 animate-fade-in">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-yellow-500 text-black"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-600">
              ⚠ Delete User Account
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold">{deleteTarget.name}</span>?{" "}
              This action <span className="font-bold">cannot be undone</span>{" "}
              and will remove all their data.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                {deleting && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block / Unblock Modal */}
      {blockTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3
              className={`text-lg font-bold ${
                blockTarget.isBlocked ? "text-blue-600" : "text-red-600"
              }`}
            >
              {blockTarget.isBlocked ? "Unblock User" : "Block User"}
            </h3>

            {!blockTarget.isBlocked ? (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  You are about to block{" "}
                  <span className="font-semibold">
                    {blockTarget.name}
                  </span>
                  . Please specify a reason. This will log them out from
                  all devices.
                </p>
                <textarea
                  rows="3"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none outline-none border border-gray-200 dark:border-gray-600 focus:border-teal-500 dark:focus:border-teal-400"
                  placeholder="Enter block reason..."
                />
              </>
            ) : (
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-sm">
                <p className="font-semibold mb-1">Previous Block Reason:</p>
                <p className="text-gray-700 dark:text-gray-200">
                  {blockTarget.blockReason || "No reason stored."}
                </p>
                {blockTarget.blockTimestamp && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Blocked on:{" "}
                    {new Date(
                      blockTarget.blockTimestamp
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setBlockTarget(null);
                  setBlockReason("");
                }}
                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitBlockToggle}
                disabled={processingBlock}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-60 ${
                  blockTarget.isBlocked
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processingBlock && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {blockTarget.isBlocked ? "Unblock" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {viewTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400 flex items-center gap-2">
              <Eye size={20} /> User Profile
            </h3>

            <div className="space-y-2 text-sm text-gray-800 dark:text-gray-100">
              <p>
                <span className="font-semibold">Name:</span>{" "}
                {viewTarget.name}
              </p>
              <p>
                <span className="font-semibold">Email:</span>{" "}
                {viewTarget.email}
              </p>
              <p className="font-semibold text-teal-600 dark:text-teal-400">
                Coins: {viewTarget.coins ?? 0}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                <span
                  className={
                    viewTarget.isBlocked
                      ? "text-red-500"
                      : "text-green-500"
                  }
                >
                  {viewTarget.isBlocked ? "Blocked" : "Active"}
                </span>
              </p>

              {viewTarget.isBlocked && (
                <div className="bg-red-100 dark:bg-red-900/60 border border-red-300 dark:border-red-700 rounded-md p-3 text-xs">
                  <p className="font-semibold mb-1">Block Reason</p>
                  <p className="text-red-900 dark:text-red-100">
                    {viewTarget.blockReason || "No reason provided."}
                  </p>
                  {viewTarget.blockTimestamp && (
                    <p className="mt-1 text-[10px] text-red-700 dark:text-red-200">
                      Blocked on:{" "}
                      {new Date(
                        viewTarget.blockTimestamp
                      ).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-600 dark:text-gray-400">
                Joined:{" "}
                {viewTarget.createdAt
                  ? new Date(
                      viewTarget.createdAt
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
              {viewTarget.lastLogin && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Last Login:{" "}
                  {new Date(
                    viewTarget.lastLogin
                  ).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewTarget(null)}
                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-600 dark:text-teal-400">
            👥 User Management Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage learners, rewards, and account status with full control and visibility.
          </p>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-600 dark:text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-3" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full border-collapse text-sm text-left">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 uppercase text-xs">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3 text-center">Coins</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => (
                    <tr
                      key={u._id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                        {u.name}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">
                        {u.email}
                      </td>

                      <td className="p-3 text-center font-semibold text-teal-600 dark:text-teal-400">
                        {u.coins ?? 0}
                      </td>

                      <td
                        className={`p-3 text-center font-semibold ${
                          u.isBlocked
                            ? "text-red-500 dark:text-red-400"
                            : "text-green-500 dark:text-green-400"
                        }`}
                      >
                        {u.isBlocked ? "Blocked" : "Active"}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            onClick={() => setViewTarget(u)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye size={14} /> View
                          </button>

                          <button
                            onClick={() => handleCoinUpdate(u._id, +10)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs text-white bg-green-600 hover:bg-green-700"
                          >
                            <Plus size={14} /> +10
                          </button>

                          <button
                            onClick={() => handleCoinUpdate(u._id, -10)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs text-white bg-yellow-600 hover:bg-yellow-700"
                          >
                            <Minus size={14} /> -10
                          </button>

                          <button
                            onClick={() => openBlockModal(u)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs text-white ${
                              u.isBlocked
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            {u.isBlocked ? (
                              <>
                                <Unlock size={14} /> Unblock
                              </>
                            ) : (
                              <>
                                <Ban size={14} /> Block
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs text-white bg-red-700 hover:bg-red-800"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UsersPage;
