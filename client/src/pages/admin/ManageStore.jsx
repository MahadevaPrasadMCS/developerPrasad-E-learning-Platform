import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Trash2, UploadCloud } from "lucide-react";

function ManageStore() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    coinsRequired: "",
    type: "pdf",
  });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const adminHeaders = { "X-Auth-Role": "admin" };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/store", { headers: adminHeaders });
      setResources(res.data || []);
    } catch (err) {
      console.error("Fetch resources failed:", err);
      showToast("❌ Failed to load resources.", "error");
    } finally {
      setLoading(false);
    }
  }, [adminHeaders]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return showToast("⚠️ Please select a file first.", "error");

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    formData.append("file", file);

    try {
      await api.post("/store/upload", formData, {
        headers: {
          ...adminHeaders,
          "Content-Type": "multipart/form-data",
        },
      });
      showToast("✅ Resource uploaded successfully!", "success");
      setForm({ title: "", description: "", coinsRequired: "", type: "pdf" });
      setFile(null);
      fetchResources();
    } catch (err) {
      console.error("Upload failed:", err);
      showToast(err.response?.data?.message || "❌ Upload failed", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      await api.delete(`/store/${id}`, { headers: adminHeaders });
      showToast("🗑️ Resource deleted successfully.", "success");
      fetchResources();
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("❌ Failed to delete resource.", "error");
    }
  };

  if (user?.role !== "admin")
    return (
      <p className="text-center mt-10 text-red-500 font-semibold">
        Access denied — Admins only.
      </p>
    );

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

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400">
          📚 Manage Store Resources
        </h1>

        {/* Upload Form */}
        <form
          onSubmit={handleUpload}
          className="max-w-2xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 rounded-2xl shadow-lg space-y-5 transition-all duration-300 hover:shadow-2xl"
        >
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2 text-center">
            Upload New Resource
          </h2>

          <input
            type="text"
            placeholder="Title"
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <textarea
            placeholder="Description (optional)"
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Coins Required"
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              value={form.coinsRequired}
              onChange={(e) => setForm({ ...form, coinsRequired: e.target.value })}
              required
            />
            <select
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="pdf">📘 PDF</option>
              <option value="video">🎥 Video</option>
            </select>
          </div>

          <input
            type="file"
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 cursor-pointer file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-teal-600 file:text-white hover:file:bg-teal-700"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow transition-all duration-300"
          >
            <UploadCloud size={18} /> Upload Resource
          </button>
        </form>

        {/* Resource Section */}
        <section>
          <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-200 mb-6">
            🗂 Uploaded Resources
          </h2>

          {loading ? (
            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400 py-10">
              <Loader2 className="animate-spin w-8 h-8 text-teal-500 mb-3" />
              Loading resources...
            </div>
          ) : resources.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
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
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    💰 <b>{r.coinsRequired}</b> coins • {r.type.toUpperCase()}
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm shadow transition-all duration-200"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ManageStore;
