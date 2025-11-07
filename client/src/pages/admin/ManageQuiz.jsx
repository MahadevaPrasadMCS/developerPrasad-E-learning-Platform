import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Plus, Trash, Edit, Clock, CheckCircle2, XCircle, X } from "lucide-react";

/* ============================================================
   QUIZ PUBLISHING CONTROLS
============================================================ */
function PublishControls({ quiz, onSuccess, showToast }) {
  const [isScheduling, setIsScheduling] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const publish = async (data, successMsg) => {
    try {
      setLoading(true);
      await api.put(`/quiz/publish/${quiz._id}`, data);
      showToast(successMsg, "success");
      onSuccess();
    } catch (err) {
      console.error("Publish failed:", err);
      showToast(err.response?.data?.message || "Failed to publish quiz.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNow = () => {
    const start = new Date();
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    publish(
      { startTime: start.toISOString(), endTime: end.toISOString() },
      "✅ Quiz published successfully!"
    );
  };

  const handleSchedule = () => {
    if (!startTime || !endTime)
      return showToast("Please set both start and end times.", "error");
    if (new Date(startTime) >= new Date(endTime))
      return showToast("End time must be after start time.", "error");
    publish({ startTime, endTime }, "✅ Quiz scheduled successfully!");
  };

  return (
    <div className="mt-2">
      {!isScheduling ? (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePublishNow}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-md shadow-sm transition-all"
          >
            <CheckCircle2 size={14} />
            {loading ? "Publishing..." : "Publish Now"}
          </button>

          <button
            onClick={() => setIsScheduling(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-md shadow-sm transition-all"
          >
            <Clock size={14} /> Schedule
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={handleSchedule}
            disabled={loading}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md shadow-sm transition-all"
          >
            {loading ? "Scheduling..." : "Confirm"}
          </button>
          <button
            onClick={() => setIsScheduling(false)}
            className="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MANAGE QUIZZES PAGE
============================================================ */
function ManageQuiz() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editQuiz, setEditQuiz] = useState(null); // 🧩 holds quiz to edit

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/quiz/list");
      setQuizzes(res.data || []);
    } catch (err) {
      console.error("Fetch quizzes failed:", err);
      showToast("❌ Failed to load quizzes.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: editQuiz.title,
        description: editQuiz.description,
        questions: editQuiz.questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.options[q.correctAnswerIndex],
          coins: q.coins || 10,
        })),
      };
      await api.put(`/quiz/${editQuiz._id}`, payload);
      showToast("✅ Quiz updated successfully!", "success");
      setEditQuiz(null);
      fetchQuizzes();
    } catch (err) {
      console.error("Update failed:", err);
      showToast("❌ Failed to update quiz.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz permanently?")) return;
    try {
      await api.delete(`/quiz/${id}`);
      showToast("🗑️ Quiz deleted successfully.", "success");
      fetchQuizzes();
    } catch {
      showToast("❌ Failed to delete quiz.", "error");
    }
  };

  const handleUnpublish = async (id) => {
    if (!window.confirm("Unpublish this quiz?")) return;
    try {
      await api.put(`/quiz/unpublish/${id}`);
      showToast("⚠️ Quiz unpublished.", "info");
      fetchQuizzes();
    } catch {
      showToast("❌ Unpublish failed.", "error");
    }
  };

  if (user?.role !== "admin")
    return <p className="text-center text-red-500 mt-10">Access denied — Admins only.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-6">
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

      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-10">
          🧩 Manage Quizzes
        </h1>

        {/* QUIZ LIST */}
        {loading ? (
          <div className="flex justify-center items-center gap-3 text-gray-600 dark:text-gray-400">
            <Loader2 className="animate-spin w-5 h-5" /> Loading quizzes...
          </div>
        ) : (
          quizzes.map((q) => {
            const now = new Date();
            const start = q.startTime ? new Date(q.startTime) : null;
            const end = q.endTime ? new Date(q.endTime) : null;

            let statusLabel = "Draft";
            if (end && now > end) statusLabel = "Expired";
            else if (start && now < start) statusLabel = "Scheduled";
            else if (start && now >= start && end && now <= end) statusLabel = "Live";

            return (
              <div
                key={q._id}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-6 mb-6 shadow-lg hover:shadow-2xl transition-all border border-gray-200 dark:border-gray-700 animate-fade-in"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {q.title}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700">
                        {statusLabel}
                      </span>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      {q.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setEditQuiz(q)}
                      className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-all"
                    >
                      <Edit size={14} /> Edit
                    </button>

                    {q.status === "draft" ? (
                      <PublishControls quiz={q} onSuccess={fetchQuizzes} showToast={showToast} />
                    ) : (
                      <button
                        onClick={() => handleUnpublish(q._id)}
                        className="flex items-center gap-1 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm transition-all"
                      >
                        <XCircle size={14} /> Unpublish
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(q._id)}
                      className="flex items-center gap-1 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-all"
                    >
                      <Trash size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🧩 EDIT QUIZ MODAL */}
      {editQuiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400">
                ✏️ Edit Quiz – {editQuiz.title}
              </h3>
              <button onClick={() => setEditQuiz(null)} className="text-gray-500 hover:text-red-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <input
                value={editQuiz.title}
                onChange={(e) => setEditQuiz({ ...editQuiz, title: e.target.value })}
                className="w-full p-3 mb-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500"
              />
              <textarea
                value={editQuiz.description}
                onChange={(e) => setEditQuiz({ ...editQuiz, description: e.target.value })}
                className="w-full p-3 mb-5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500"
              />

              {editQuiz.questions.map((q, qi) => (
                <div key={qi} className="mb-4 p-3 border rounded-md dark:border-gray-600">
                  <input
                    value={q.question}
                    onChange={(e) => {
                      const updated = [...editQuiz.questions];
                      updated[qi].question = e.target.value;
                      setEditQuiz({ ...editQuiz, questions: updated });
                    }}
                    className="w-full p-2 mb-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />

                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2 mb-2">
                      <input
                        value={opt}
                        onChange={(e) => {
                          const updated = [...editQuiz.questions];
                          updated[qi].options[oi] = e.target.value;
                          setEditQuiz({ ...editQuiz, questions: updated });
                        }}
                        className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                      <input
                        type="radio"
                        checked={q.correctAnswerIndex === oi}
                        onChange={() => {
                          const updated = [...editQuiz.questions];
                          updated[qi].correctAnswerIndex = oi;
                          setEditQuiz({ ...editQuiz, questions: updated });
                        }}
                        className="accent-teal-600"
                      />
                    </div>
                  ))}
                </div>
              ))}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditQuiz(null)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageQuiz;
