import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

function UsersPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchUsers();
  }, [user]);

  const handleCoinUpdate = async (id, change) => {
    try {
      const res = await api.patch(
        `/users/coins/${id}`,
        { change },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      fetchUsers();
    } catch {
      setMessage("❌ Failed to update coins.");
    }
  };

  const handleBlockToggle = async (id) => {
    try {
      const res = await api.patch(
        `/users/block/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      fetchUsers();
    } catch {
      setMessage("❌ Failed to update user status.");
    }
  };

  if (user?.role !== "admin")
    return (
      <p className="text-center mt-10 text-red-500">
        Access denied — Admins only.
      </p>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-6 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-10">
          👥 User Management Dashboard
        </h1>

        {message && (
          <p className="text-center mb-6 text-teal-600 dark:text-teal-400 font-medium">
            {message}
          </p>
        )}

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg p-8 transition-all hover:shadow-2xl">
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Loading users...
            </p>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full border-collapse text-sm text-left">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-center">Coins</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => (
                    <tr
                      key={u._id}
                      className={`border-t border-gray-200 dark:border-gray-700 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 animate-fade-in`}
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3 capitalize">{u.role}</td>
                      <td className="p-3 text-center text-indigo-600 dark:text-indigo-400 font-semibold">
                        {u.coins}
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
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs transition"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleCoinUpdate(u._id, -10)}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-xs transition"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => handleBlockToggle(u._id)}
                          className={`px-3 py-1 rounded-md text-xs transition ${
                            u.isBlocked
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-red-600 hover:bg-red-700"
                          } text-white`}
                        >
                          {u.isBlocked ? "Unblock" : "Block"}
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
