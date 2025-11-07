import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Coins, Trash2, X } from "lucide-react";

function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [coinChange, setCoinChange] = useState("");

  const adminHeaders = { "X-Auth-Role": "admin" };

  // Toast handler
  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (user?.role === "admin") fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users", { headers: adminHeaders });
      setUsers(res.data || []);
    } catch (err) {
      console.error("Fetch users failed:", err);
      showToast("❌ Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateCoins = async (id) => {
    if (!coinChange || isNaN(coinChange))
      return showToast("⚠️ Enter a valid coin amount (+/-)", "error");
    try {
      await api.put(
        `/admin/users/${id}/coins`,
        { amount: Number(coinChange) },
        { headers: adminHeaders }
      );
      showToast("✅ Coins updated successfully!", "success");
      setCoinChange("");
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Coin update failed:", err);
      showToast("❌ Failed to update coins.", "error");
    }
  };

  const deleteUser = async (id, name, role) => {
    if (role === "admin") return showToast("🚫 Cannot delete admin accounts.", "error");
    if (!window.confirm(`Are you sure you want to delete ${name}'s account?`)) return;
    try {
      await api.delete(`/admin/users/${id}`, { headers: adminHeaders });
      showToast(`🗑️ ${name}'s account deleted.`, "success");
      fetchUsers();
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("❌ Failed to delete user.", "error");
    }
  };

  if (user?.role !== "admin")
    return (
      <div className="text-center text-red-500 mt-10 font-semibold">
        Access denied — Admins only.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6">
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

      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400">
          👥 Manage Users
        </h1>

        {/* Loading or Empty */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-600 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-3" />
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 text-lg py-10">
            No users found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl shadow-lg backdrop-blur-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full">
              <thead className="bg-teal-600 text-white text-sm uppercase">
                <tr>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-center">Role</th>
                  <th className="py-3 px-4 text-center">Coins</th>
                  <th className="py-3 px-4 text-center">Joined</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200">
                {users.map((u, i) => (
                  <tr
                    key={u._id}
                    className={`border-t border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-gray-700/40 transition-all ${
                      u.role === "admin" ? "opacity-80" : ""
                    }`}
                  >
                    <td className="py-3 px-4">{u.name}</td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4 text-center">
                      {u.role === "admin" ? (
                        <span className="text-red-500 font-semibold">Admin</span>
                      ) : (
                        "User"
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-teal-600 dark:text-teal-400 font-medium">
                      {u.coins ?? 0}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          disabled={u.role === "admin"}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-white transition ${
                            u.role === "admin"
                              ? "bg-gray-500 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          <Coins size={15} /> Coins
                        </button>
                        <button
                          onClick={() => deleteUser(u._id, u.name, u.role)}
                          disabled={u.role === "admin"}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-white transition ${
                            u.role === "admin"
                              ? "bg-gray-500 cursor-not-allowed"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Coin Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400">
                  Adjust Coins – {selectedUser.name}
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-red-500 transition"
                >
                  <X size={20} />
                </button>
              </div>
              <input
                type="number"
                value={coinChange}
                onChange={(e) => setCoinChange(e.target.value)}
                placeholder="Enter amount (+/-)"
                className="w-full p-3 mb-5 border rounded-lg text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateCoins(selectedUser._id)}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md shadow-md transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
