// src/pages/admin/AdminLogs.jsx
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { Loader2, ShieldCheck } from "lucide-react";

function AdminLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get("/users/logs", {
          headers: { "X-Auth-Role": "admin" },
        });
        setLogs(res.data || []);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        showToast("❌ Failed to fetch admin logs.", "error");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") fetchLogs();
  }, [user]);

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-red-500 font-semibold">Access Denied</p>
      </div>
    );
  }

  const actionBadge = (action) => {
    if (!action) return "bg-gray-500 text-white";
    if (action.includes("block")) return "bg-red-600 text-white";
    if (action.includes("coins")) return "bg-amber-500 text-black";
    if (action.includes("delete_user")) return "bg-red-700 text-white";
    if (action.includes("profile_change")) return "bg-indigo-500 text-white";
    return "bg-gray-600 text-white";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-4 sm:px-6 lg:px-8">
      {toast && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <ShieldCheck className="text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            Admin Activity Logs
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-gray-600 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No admin actions recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-700 uppercase text-xs text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="p-3 text-left">Admin</th>
                  <th className="p-3 text-left">Action</th>
                  <th className="p-3 text-left">Target User</th>
                  <th className="p-3 text-left">Details</th>
                  <th className="p-3 text-center">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr
                    key={log._id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="p-3">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {log.admin?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {log.admin?.email}
                      </p>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-[11px] font-semibold ${actionBadge(
                          log.action
                        )}`}
                      >
                        {log.action?.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="p-3">
                      {log.targetUser ? (
                        <>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {log.targetUser.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {log.targetUser.email}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          (Deleted user)
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-gray-700 dark:text-gray-200">
                      {log.details}
                    </td>

                    <td className="p-3 text-center text-xs text-gray-600 dark:text-gray-300">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString()
                        : "—"}
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

export default AdminLogs;
