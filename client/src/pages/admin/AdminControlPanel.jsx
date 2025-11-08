import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  Power,
  Ban,
  Wrench,
  Loader2,
} from "lucide-react";

function AdminControlPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ✅ Memoized admin headers
  const adminHeaders = useMemo(() => ({ "X-Auth-Role": "admin" }), []);

  // Toast utility
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 🧠 Fetch users (memoized)
  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/control/users", { headers: adminHeaders });
      setUsers(res.data || []);
    } catch (err) {
      console.error("Fetch users failed:", err);
      showToast("❌ Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  }, [adminHeaders]);

  // ⚙️ Fetch maintenance status (memoized)
  const fetchMaintenance = useCallback(async () => {
    try {
      const res = await api.get("/admin/control/maintenance/status", {
        headers: adminHeaders,
      });
      setMaintenance(res.data.maintenanceMode);
    } catch (err) {
      console.error("Maintenance fetch failed:", err);
    }
  }, [adminHeaders]);

  useEffect(() => {
    fetchUsers();
    fetchMaintenance();
  }, [fetchUsers, fetchMaintenance]);

  // 🚪 Force logout all users
  const handleForceLogout = async () => {
    if (!window.confirm("Force logout all active users?")) return;
    setActionLoading(true);
    try {
      await api.post("/admin/control/force-logout", {}, { headers: adminHeaders });
      showToast("✅ All users have been logged out.", "success");
    } catch {
      showToast("❌ Failed to force logout users.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // 🧱 Toggle maintenance mode
  const toggleMaintenance = async () => {
    const newState = !maintenance ? "on" : "off";
    try {
      await api.post(`/admin/control/maintenance/${newState}`, {}, { headers: adminHeaders });
      setMaintenance(!maintenance);
      showToast(
        !maintenance
          ? "⚙️ Maintenance mode enabled."
          : "✅ Maintenance mode disabled.",
        "success"
      );
    } catch {
      showToast("❌ Could not toggle maintenance mode.", "error");
    }
  };

  // 🧍 Change role (user ↔ admin)
  const changeRole = async (id, newRole) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/control/role/${id}`, { role: newRole }, { headers: adminHeaders });
      setUsers((prev) =>
        prev.map((usr) => (usr._id === id ? { ...usr, role: newRole } : usr))
      );
      showToast(`✅ Role updated to ${newRole}.`, "success");
    } catch {
      showToast("❌ Failed to update role.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // 🚫 Block/unblock user
  const toggleBlock = async (id, isBlocked) => {
    setActionLoading(true);
    try {
      await api.put(
        `/admin/control/users/${id}/block`,
        { isBlocked: !isBlocked },
        { headers: adminHeaders }
      );
      setUsers((prev) =>
        prev.map((usr) =>
          usr._id === id ? { ...usr, isBlocked: !isBlocked } : usr
        )
      );
      showToast(!isBlocked ? "🚫 User blocked." : "✅ User unblocked.", "success");
    } catch {
      showToast("❌ Failed to update block state.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Restrict non-admins
  if (user?.role !== "admin")
    return (
      <div className="text-center text-red-500 font-semibold mt-10">
        Access denied — Admins only.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-4">
          🛡️ Admin Control Panel
        </h1>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-5 right-5 px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in z-50 ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : toast.type === "error"
                ? "bg-red-600 text-white"
                : "bg-yellow-500 text-black"
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* System Controls */}
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-lg p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wrench className="text-teal-500" />
            <p className="font-semibold text-gray-700 dark:text-gray-200">
              Maintenance Mode:
            </p>
            <span
              className={`font-bold ${
                maintenance ? "text-red-500" : "text-green-500"
              }`}
            >
              {maintenance ? "ON" : "OFF"}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={toggleMaintenance}
              className={`px-4 py-2 rounded-md text-white font-semibold transition-all ${
                maintenance
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {maintenance ? "Disable" : "Enable"}
            </button>
            <button
              onClick={handleForceLogout}
              disabled={actionLoading}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-md flex items-center gap-2 disabled:opacity-60"
            >
              {actionLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Power size={18} />
              )}
              Force Logout All
            </button>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="text-teal-500" />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Manage Users
            </h2>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 animate-pulse">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-left text-gray-700 dark:text-gray-300 text-sm uppercase">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Coins</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Joined</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u._id}
                      className={`border-b border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-gray-700/50 transition-all duration-200 ${
                        u.isBlocked ? "opacity-60" : ""
                      }`}
                    >
                      <td className="p-3 font-medium text-gray-800 dark:text-gray-100">
                        {u.name}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">
                        {u.email}
                      </td>
                      <td className="p-3 text-teal-600 dark:text-teal-400 font-semibold">
                        {u.coins}
                      </td>
                      <td className="p-3 capitalize">{u.role}</td>
                      <td className="p-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 flex flex-wrap gap-2">
                        {u.role !== "admin" && (
                          <>
                            <button
                              onClick={() =>
                                changeRole(
                                  u._id,
                                  u.role === "user" ? "admin" : "user"
                                )
                              }
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md shadow transition-all"
                            >
                              {u.role === "user" ? "Promote" : "Demote"}
                            </button>
                            <button
                              onClick={() => toggleBlock(u._id, u.isBlocked)}
                              className={`px-3 py-1 text-sm rounded-md shadow transition-all text-white flex items-center gap-1 ${
                                u.isBlocked
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-red-600 hover:bg-red-700"
                              }`}
                            >
                              <Ban size={14} />
                              {u.isBlocked ? "Unblock" : "Block"}
                            </button>
                          </>
                        )}
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

export default AdminControlPanel;
