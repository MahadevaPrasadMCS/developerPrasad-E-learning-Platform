import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Plus, Minus, Ban, Unlock } from "lucide-react";

function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Memoized headers
  const adminHeaders = useMemo(() => ({ "X-Auth-Role": "admin" }), []);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/users", { headers: adminHeaders });
      setUsers(res.data || []);
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
      const res = await api.patch(`/users/coins/${id}`, { change }, { headers: adminHeaders });
      showToast(res.data.message || "✅ Coins updated successfully.", "success");
      fetchUsers();
    } catch (err) {
      console.error("Coin update failed:", err);
      showToast("❌ Failed to update coins.", "error");
    }
  };

  const handleBlockToggle = async (id) => {
    try {
      const res = await api.patch(`/users/block/${id}`, {}, { headers: adminHeaders });
      showToast(res.data.message || "✅ User status updated.", "success");
      fetchUsers();
    } catch (err) {
      console.error("Block/unblock failed:", err);
      showToast("❌ Failed to update user status.", "error");
    }
  };

  if (user?.role !== "admin")
    return <div className="text-center text-red-500 font-semibold mt-10">Access denied — Admins only.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-6 animate-fade-in">
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
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-10">
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400">
          👥 User Management Dashboard
        </h1>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg p-8 transition-all hover:shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-600 dark:text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-3" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No users found.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full border-collapse text-sm text-left">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 uppercase text-xs">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3 text-center">Role</th>
                    <th className="p-3 text-center">Coins</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => (
                    <tr
                      key={u._id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                      <td className="p-3 text-center capitalize">
                        {u.role === "admin" ? (
                          <span className="text-red-500 font-semibold">Admin</span>
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300">User</span>
                        )}
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
                      <td className="p-3 text-center space-x-2">
                        <button
                          onClick={() => handleCoinUpdate(u._id, +10)}
                          disabled={u.role === "admin"}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs text-white transition-all ${
                            u.role === "admin"
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          <Plus size={14} /> +10
                        </button>
                        <button
                          onClick={() => handleCoinUpdate(u._id, -10)}
                          disabled={u.role === "admin"}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs text-white transition-all ${
                            u.role === "admin"
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-yellow-600 hover:bg-yellow-700"
                          }`}
                        >
                          <Minus size={14} /> -10
                        </button>
                        <button
                          onClick={() => handleBlockToggle(u._id)}
                          disabled={u.role === "admin"}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs text-white transition-all ${
                            u.role === "admin"
                              ? "bg-gray-400 cursor-not-allowed"
                              : u.isBlocked
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
