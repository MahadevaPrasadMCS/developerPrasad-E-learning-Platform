import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Trash2 } from "lucide-react";

function AdminUsers() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Memoized admin header
  const adminHeaders = useMemo(() => ({ "X-Auth-Role": "admin" }), []);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users", { headers: adminHeaders });
      setAdmins(res.data || []);
    } catch (err) {
      console.error("Failed to load admins:", err);
      showToast("❌ Failed to load admin users.", "error");
    } finally {
      setLoading(false);
    }
  }, [adminHeaders]);

  useEffect(() => {
    if (user?.role === "admin") fetchAdmins();
  }, [user, fetchAdmins]);

  const deleteAdmin = async (id, name, role) => {
    if (role !== "admin") return showToast("⚠️ Can only delete admin accounts.", "error");
    if (!window.confirm(`Are you sure you want to delete admin ${name}?`)) return;
    try {
      await api.delete(`/admin/users/${id}`, { headers: adminHeaders });
      showToast(`🗑️ Admin ${name} deleted successfully.`, "success");
      fetchAdmins();
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("❌ Failed to delete admin.", "error");
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

      <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400">
          🛡️ Admin Management
        </h1>

        {/* Loading / Empty / Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-600 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-3" />
            Loading admin users...
          </div>
        ) : admins.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 text-lg py-10">
            No admins found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl shadow-lg backdrop-blur-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full">
              <thead className="bg-teal-600 text-white text-sm uppercase">
                <tr>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-center">Role</th>
                  <th className="py-3 px-4 text-center">Joined</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200">
                {admins.map((a) => (
                  <tr
                    key={a._id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-gray-700/40 transition-all"
                  >
                    <td className="py-3 px-4">{a.name}</td>
                    <td className="py-3 px-4">{a.email}</td>
                    <td className="py-3 px-4 text-center text-red-500 font-semibold">
                      Admin
                    </td>
                    <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => deleteAdmin(a._id, a.name, a.role)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white transition"
                      >
                        <Trash2 size={15} /> Delete
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
  );
}

export default AdminUsers;
