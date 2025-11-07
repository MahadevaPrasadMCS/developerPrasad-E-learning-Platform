import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

function AdminAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    links: [""],
    specialThings: "",
  });
  const [loading, setLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const adminHeaders = { "X-Auth-Role": "admin" };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    setGlobalLoading(true);
    try {
      const res = await api.get("/announcements", { headers: adminHeaders });
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchAnnouncements();
  }, [user]);

  // Toast utility
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Post new
  const postAnnouncement = async () => {
    const { title, description } = form;
    if (!title || !description)
      return showToast("⚠️ Title & Description are required!", "warn");
    setLoading(true);
    try {
      await api.post("/announcements", form, { headers: adminHeaders });
      showToast("✅ Announcement posted successfully!", "success");
      setForm({ title: "", description: "", links: [""], specialThings: "" });
      fetchAnnouncements();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      showToast("❌ Error posting announcement.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await api.delete(`/announcements/${id}`, { headers: adminHeaders });
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      showToast("🗑️ Deleted successfully!", "success");
    } catch {
      showToast("❌ Failed to delete announcement.", "error");
    }
  };

  // Edit modal open
  const openEditModal = (a) => {
    setEditing(a._id);
    setEditForm({
      title: a.title,
      description: a.description,
      links: a.links?.length ? [...a.links] : [""],
      specialThings: a.specialThings || "",
    });
  };

  // Save edit
  const saveEdit = async () => {
    try {
      await api.patch(`/announcements/${editing}`, editForm, {
        headers: adminHeaders,
      });
      showToast("✅ Announcement updated!", "success");
      setEditing(null);
      setEditForm(null);
      fetchAnnouncements();
    } catch {
      showToast("❌ Update failed.", "error");
    }
  };

  if (user?.role !== "admin")
    return (
      <p className="text-center mt-10 text-red-500 font-semibold">
        Access Denied — Admins Only
      </p>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-6 transition-all duration-300">
      <div className="max-w-5xl mx-auto space-y-10">
        <h2 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-6">
          🛠 Manage Announcements
        </h2>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-5 right-5 px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : toast.type === "warn"
                ? "bg-yellow-500 text-black"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Form */}
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700 pb-2">
            Create Announcement
          </h3>

          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full p-3 rounded-lg border dark:border-gray-600 dark:bg-gray-700 mb-4 focus:ring-2 focus:ring-teal-500"
          />

          <textarea
            rows="4"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-3 rounded-lg border dark:border-gray-600 dark:bg-gray-700 mb-4 focus:ring-2 focus:ring-teal-500"
          ></textarea>

          {/* Links */}
          <div className="mb-3">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔗 Links
            </p>
            {form.links.map((link, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="url"
                  placeholder={`Link ${i + 1}`}
                  value={link}
                  onChange={(e) => {
                    const updated = [...form.links];
                    updated[i] = e.target.value;
                    setForm({ ...form, links: updated });
                  }}
                  className="flex-1 p-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-teal-500"
                />
                {form.links.length > 1 && (
                  <button
                    onClick={() =>
                      setForm({
                        ...form,
                        links: form.links.filter((_, idx) => idx !== i),
                      })
                    }
                    className="text-red-500 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setForm({ ...form, links: [...form.links, ""] })}
              className="text-sm text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              + Add Link
            </button>
          </div>

          <textarea
            rows="3"
            placeholder="Special Highlights"
            value={form.specialThings}
            onChange={(e) =>
              setForm({ ...form, specialThings: e.target.value })
            }
            className="w-full p-3 rounded-lg border dark:border-gray-600 dark:bg-gray-700 mb-4 focus:ring-2 focus:ring-teal-500"
          ></textarea>

          <div className="flex justify-end">
            <button
              onClick={postAnnouncement}
              disabled={loading}
              className={`px-6 py-2 text-white rounded-lg font-semibold shadow transition-all duration-300 ${
                loading
                  ? "bg-teal-400 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-700 hover:scale-105"
              }`}
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>

        {/* Announcements */}
        {globalLoading ? (
          <div className="text-center py-10 text-gray-600 dark:text-gray-400 animate-pulse">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            No announcements found.
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map((a) => (
              <div
                key={a._id}
                className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow p-6 hover:shadow-xl transition-all duration-300 animate-fade-in"
              >
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <h3 className="text-2xl font-semibold text-teal-600 dark:text-teal-400">
                    {a.title}
                  </h3>
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => openEditModal(a)}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      ✏ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mt-3">
                  {a.description}
                </p>
                {a.links?.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-blue-500 dark:text-blue-400">
                    {a.links.map((l, i) => (
                      <li key={i}>
                        <a
                          href={l}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && editForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-lg shadow-xl relative">
            <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-3">
              Edit Announcement
            </h3>

            <input
              type="text"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              className="w-full p-3 rounded-lg border dark:border-gray-600 dark:bg-gray-700 mb-3 focus:ring-2 focus:ring-teal-500"
            />
            <textarea
              rows="4"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              className="w-full p-3 rounded-lg border dark:border-gray-600 dark:bg-gray-700 mb-4 focus:ring-2 focus:ring-teal-500"
            ></textarea>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditing(null);
                  setEditForm(null);
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md shadow"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAnnouncements;
