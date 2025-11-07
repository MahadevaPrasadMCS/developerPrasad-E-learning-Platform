import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import {
  Loader2,
  Plus,
  Trash,
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/* ============================================================
   QUIZ PUBLISHING CONTROLS
============================================================ */
function PublishControls({ quiz, onSuccess, showToast }) {
  const [isScheduling, setIsScheduling] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const adminHeaders = { "X-Auth-Role": "admin" };

  const publish = async (data, successMsg) => {
    try {
      setLoading(true);
      await api.put(`/quiz/publish/${quiz._id}`, data, { headers: adminHeaders });
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
            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
          >
            <CheckCircle2 size={14} /> {loading ? "Publishing..." : "Publish Now"}
          </button>
          <button
            onClick={() => setIsScheduling(true)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
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
            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md"
          >
            {loading ? "Scheduling..." : "Confirm"}
          </button>
          <button
            onClick={() => setIsScheduling(false)}
            className="px-3 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
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
  const [editingQuiz, setEditingQuiz] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    questions: [
      { question: "", options: ["", "", "", ""], correctAnswerIndex: null, coins: 10 },
    ],
  });

  const adminHeaders = { "X-Auth-Role": "admin" };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/quiz/list", { headers: adminHeaders });
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

  const validateForm = () => {
    if (!form.title.trim()) return showToast("Title is required.", "error");
    for (const q of form.questions) {
      if (!q.question.trim()) return showToast("Each question needs text.", "error");
      if (!q.options.some((o) => o.trim()))
        return showToast("Each question needs at least one option.", "error");
      if (q.correctAnswerIndex === null)
        return showToast("Please select a correct answer.", "error");
    }
    return true;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        questions: form.questions.map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()),
          correctAnswer:
            q.correctAnswerIndex !== null ? q.options[q.correctAnswerIndex] : "",
          coins: Number(q.coins),
        })),
      };
      await api.post("/quiz/create", payload, { headers: adminHeaders });
      showToast("✅ Quiz created successfully (Draft).", "success");
      setForm({
        title: "",
        description: "",
        questions: [{ question: "", options: ["", "", "", ""], correctAnswerIndex: null, coins: 10 }],
      });
      fetchQuizzes();
    } catch (err) {
      console.error("Quiz creation failed:", err);
      showToast("❌ Quiz creation failed.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz permanently?")) return;
    try {
      await api.delete(`/quiz/${id}`, { headers: adminHeaders });
      showToast("🗑️ Quiz deleted successfully.", "success");
      fetchQuizzes();
    } catch {
      showToast("❌ Failed to delete quiz.", "error");
    }
  };

  const handleUnpublish = async (id) => {
    if (!window.confirm("Unpublish this quiz?")) return;
    try {
      await api.put(`/quiz/unpublish/${id}`, {}, { headers: adminHeaders });
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

      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-10">
          🧩 Manage Quizzes
        </h1>

        {/* CREATE QUIZ */}
        <form
          onSubmit={handleCreate}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg p-8 mb-10 hover:shadow-2xl transition-all"
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Plus size={18} /> Create New Quiz (Draft)
          </h2>

          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Quiz Title"
            className="w-full p-3 mb-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full p-3 mb-5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500"
          />

          {form.questions.map((q, qi) => (
            <div
              key={qi}
              className="p-4 mb-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600 transition-all"
            >
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Question {qi + 1}
              </h3>
              <input
                value={q.question}
                onChange={(e) => {
                  const updated = [...form.questions];
                  updated[qi].question = e.target.value;
                  setForm({ ...form, questions: updated });
                }}
                placeholder="Enter question"
                className="w-full p-2 mb-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2 mb-2">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const updated = [...form.questions];
                      updated[qi].options[oi] = e.target.value;
                      setForm({ ...form, questions: updated });
                    }}
                    placeholder={`Option ${oi + 1}`}
                    className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correctAnswerIndex === oi}
                    onChange={() => {
                      const updated = [...form.questions];
                      updated[qi].correctAnswerIndex = oi;
                      setForm({ ...form, questions: updated });
                    }}
                    className="accent-teal-600"
                  />
                </div>
              ))}
            </div>
          ))}

          <button
            type="submit"
            className="mt-3 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
          >
            Create Quiz
          </button>
        </form>

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
            let badgeStyle =
              "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300";

            if (end && now > end) {
              statusLabel = "Expired";
              badgeStyle =
                "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300";
            } else if (start && now < start) {
              statusLabel = "Scheduled";
              badgeStyle =
                "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300";
            } else if (start && now >= start && end && now <= end) {
              statusLabel = "Live";
              badgeStyle =
                "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300";
            }

            return (
              <div
                key={q._id}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-6 mb-6 shadow-lg hover:shadow-2xl transition-all border border-gray-200 dark:border-gray-700 animate-fade-in"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {q.title}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyle}`}
                      >
                        {statusLabel}
                      </span>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      {q.description || "No description provided."}
                    </p>

                    {start && end && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <p>
                          <span className="font-medium">Start:</span> {start.toLocaleString()}
                        </p>
                        <p>
                          <span className="font-medium">End:</span> {end.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setEditingQuiz(q)}
                      className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    {q.status === "draft" ? (
                      <PublishControls quiz={q} onSuccess={fetchQuizzes} showToast={showToast} />
                    ) : (
                      <button
                        onClick={() => handleUnpublish(q._id)}
                        className="flex items-center gap-1 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm transition"
                      >
                        <XCircle size={14} /> Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="flex items-center gap-1 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition"
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
    </div>
  );
}

export default ManageQuiz;
