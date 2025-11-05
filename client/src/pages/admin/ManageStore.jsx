import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

function ManageStore() {
  const { token, user } = useAuth();
  const [resources, setResources] = useState([]);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    coinsRequired: "",
    type: "pdf",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchResources = async () => {
    try {
      const res = await api.get("/store");
      setResources(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file.");

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    formData.append("file", file);

    try {
      await api.post("/store/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage("✅ Resource uploaded successfully!");
      setForm({ title: "", description: "", coinsRequired: "", type: "pdf" });
      setFile(null);
      fetchResources();
    } catch (err) {
      setMessage("❌ Upload failed");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      await api.delete(`/store/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("🗑️ Resource deleted");
      fetchResources();
    } catch (err) {
      setMessage("❌ Failed to delete");
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
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-10">
          📚 Manage Store Resources
        </h1>

        {/* Upload Form */}
        <form
          onSubmit={handleUpload}
          className="max-w-2xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-8 rounded-2xl shadow-lg space-y-4 transition-all duration-300 hover:shadow-2xl"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Upload New Resource
          </h2>

          <input
            type="text"
            placeholder="Title"
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <input
            type="number"
            placeholder="Coins required"
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            value={form.coinsRequired}
            onChange={(e) =>
              setForm({ ...form, coinsRequired: e.target.value })
            }
          />
          <select
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="pdf">📘 PDF</option>
            <option value="video">🎥 Video</option>
          </select>
          <input
            type="file"
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />

          <button
            type="submit"
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition"
          >
            🚀 Upload Resource
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-teal-600 dark:text-teal-400 font-medium">
            {message}
          </p>
        )}

        {/* Uploaded Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center">
            🗂 Uploaded Resources
          </h2>

          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Loading resources...
            </p>
          ) : resources.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No resources uploaded yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((r, index) => (
                <div
                  key={r._id}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-md p-6 border-l-4 border-teal-500 transition-all duration-300 hover:shadow-xl animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <h3 className="font-semibold text-lg text-teal-600 dark:text-teal-400 mb-1">
                    {r.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-3">
                    {r.description || "No description provided."}
                  </p>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    💰 {r.coinsRequired} coins • 📄 {r.type.toUpperCase()}
                  </div>
                  <button
                    onClick={() => handleDelete(r._id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageStore;
