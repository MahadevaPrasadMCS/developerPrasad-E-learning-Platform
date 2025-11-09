import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { Trash, Edit, Clock, CheckCircle2, X } from "lucide-react";

/* ============================================================
   QUIZ PUBLISHING CONTROLS (Reusable Component)
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
      showToast(
        err.response?.data?.message || "Failed to publish quiz.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const unpublish = async () => {
    try {
      setLoading(true);
      await api.put(`/quiz/unpublish/${quiz._id}`);
      showToast("⏸️ Quiz unpublished successfully!", "success");
      onSuccess();
    } catch (err) {
      console.error("Unpublish failed:", err);
      showToast(
        err.response?.data?.message || "Failed to unpublish quiz.",
        "error"
      );
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
    <div className="mt-3 flex flex-wrap gap-2 items-center">
      {quiz.status === "published" ? (
        <button
          onClick={unpublish}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-sm transition-all"
        >
          {loading ? "Unpublishing..." : "Unpublish"}
        </button>
      ) : !isScheduling ? (
        <>
          <button
            onClick={handlePublishNow}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm transition-all"
          >
            <CheckCircle2 size={14} />
            {loading ? "Publishing..." : "Publish Now"}
          </button>

          <button
            onClick={() => setIsScheduling(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all"
          >
            <Clock size={14} /> Schedule
          </button>
        </>
      ) : (
        <>
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
        </>
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

  const [form, setForm] = useState({
    title: "",
    description: "",
    questions: [
      { question: "", options: ["", "", "", ""], correctAnswerIndex: null, coins: 10 },
    ],
  });

  const [editQuiz, setEditQuiz] = useState(null);
  const adminHeaders = useMemo(() => ({ "X-Auth-Role": "admin" }), []);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchQuizzes = useCallback(async () => {
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
  }, [adminHeaders]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return showToast("Title is required.", "error");
    for (const q of form.questions) {
      if (!q.question.trim()) return showToast("Each question needs text.", "error");
      if (q.correctAnswerIndex === null)
        return showToast("Please select a correct answer.", "error");
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        questions: form.questions.map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()),
          correctAnswer: q.options[q.correctAnswerIndex],
          coins: Number(q.coins) || 10,
        })),
      };
      await api.post("/quiz/create", payload, { headers: adminHeaders });
      showToast("✅ Quiz created successfully (Draft).", "success");
      setForm({
        title: "",
        description: "",
        questions: [
          { question: "", options: ["", "", "", ""], correctAnswerIndex: null, coins: 10 },
        ],
      });
      fetchQuizzes();
    } catch (err) {
      console.error("Quiz creation failed:", err);
      showToast(err.response?.data?.message || "❌ Quiz creation failed.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz permanently?")) return;
    try {
      await api.delete(`/quiz/${id}`, { headers: adminHeaders });
      showToast("🗑️ Quiz deleted successfully.", "success");
      fetchQuizzes();
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("❌ Failed to delete quiz.", "error");
    }
  };

  const openEditModal = (q) => {
    const normalized = {
      ...q,
      questions: (q.questions || []).map((qq) => ({
        question: qq.question || "",
        options: qq.options.length ? [...qq.options] : ["", "", "", ""],
        correctAnswerIndex: qq.options.indexOf(qq.correctAnswer),
        coins: qq.coins || 10,
      })),
    };
    setEditQuiz(normalized);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editQuiz) return;
    try {
      const payload = {
        title: editQuiz.title.trim(),
        description: editQuiz.description?.trim() || "",
        questions: editQuiz.questions.map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()),
          correctAnswer: q.options[q.correctAnswerIndex],
          coins: Number(q.coins) || 10,
        })),
      };
      await api.put(`/quiz/${editQuiz._id}`, payload, { headers: adminHeaders });
      showToast("✅ Quiz updated successfully!", "success");
      setEditQuiz(null);
      fetchQuizzes();
    } catch (err) {
      console.error("Update failed:", err);
      showToast(err.response?.data?.message || "❌ Failed to update quiz.", "error");
    }
  };

  if (user?.role !== "admin")
    return <p className="text-center text-red-500 mt-10">Access denied — Admins only.</p>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-teal-600 mb-6">🧠 Manage Quizzes</h2>

      {toast && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded-md shadow-md text-sm z-50 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Create Quiz Form */}
      <form
        onSubmit={handleCreate}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-10 space-y-6"
      >
        <h3 className="text-2xl font-semibold text-teal-600">Create New Quiz</h3>

        <input
          type="text"
          placeholder="Quiz Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500"
        />
        <textarea
          placeholder="Quiz Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500"
        ></textarea>

        {form.questions.map((q, qIdx) => (
          <div key={qIdx} className="border p-4 rounded-xl dark:border-gray-600 mb-4">
            <div className="flex justify-between mb-3">
              <h4 className="font-semibold text-gray-700 dark:text-gray-200">
                Question {qIdx + 1}
              </h4>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    questions: form.questions.filter((_, i) => i !== qIdx),
                  })
                }
                className="text-red-500 hover:text-red-600"
              >
                <Trash size={16} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Question text"
              value={q.question}
              onChange={(e) => {
                const updated = [...form.questions];
                updated[qIdx].question = e.target.value;
                setForm({ ...form, questions: updated });
              }}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-3"
            />

            {q.options.map((opt, oIdx) => (
              <div key={oIdx} className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  checked={q.correctAnswerIndex === oIdx}
                  onChange={() => {
                    const updated = [...form.questions];
                    updated[qIdx].correctAnswerIndex = oIdx;
                    setForm({ ...form, questions: updated });
                  }}
                />
                <input
                  type="text"
                  placeholder={`Option ${oIdx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const updated = [...form.questions];
                    updated[qIdx].options[oIdx] = e.target.value;
                    setForm({ ...form, questions: updated });
                  }}
                  className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                {q.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...form.questions];
                      updated[qIdx].options.splice(oIdx, 1);
                      if (updated[qIdx].correctAnswerIndex === oIdx)
                        updated[qIdx].correctAnswerIndex = null;
                      setForm({ ...form, questions: updated });
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash size={14} />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                const updated = [...form.questions];
                updated[qIdx].options.push("");
                setForm({ ...form, questions: updated });
              }}
              className="text-teal-600 hover:text-teal-700 text-sm"
            >
              + Add Option
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setForm({
              ...form,
              questions: [
                ...form.questions,
                {
                  question: "",
                  options: ["", "", "", ""],
                  correctAnswerIndex: null,
                  coins: 10,
                },
              ],
            })
          }
          className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
        >
          + Add Question
        </button>

        <button
          type="submit"
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-lg"
        >
          Create Quiz
        </button>
      </form>

      {/* Quiz List */}
      {loading ? (
        <div className="text-center text-gray-500">Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <p className="text-center text-gray-500">No quizzes found.</p>
      ) : (
        <div className="space-y-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:justify-between"
            >
              <div>
                <h4 className="font-semibold text-teal-600 text-lg">{quiz.title}</h4>
                <p className="text-sm text-gray-500">
                  Status:{" "}
                  {quiz.status === "published" ? (
                    <span className="text-green-600 font-medium">Published</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Draft</span>
                  )}
                </p>
                {quiz.startTime && quiz.endTime && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(quiz.startTime).toLocaleString()} →{" "}
                    {new Date(quiz.endTime).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-3 sm:mt-0">
                <button
                  onClick={() => openEditModal(quiz)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(quiz._id)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash size={16} /> Delete
                </button>
              </div>

              <PublishControls
                quiz={quiz}
                showToast={showToast}
                onSuccess={fetchQuizzes}
              />
            </div>
          ))}
        </div>
      )}

      {/* Edit Quiz Modal */}
      {editQuiz && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-2xl relative">
            <button
              onClick={() => setEditQuiz(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-semibold text-teal-600 mb-4">Edit Quiz</h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <input
                type="text"
                value={editQuiz.title}
                onChange={(e) => setEditQuiz({ ...editQuiz, title: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <textarea
                value={editQuiz.description}
                onChange={(e) =>
                  setEditQuiz({ ...editQuiz, description: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              ></textarea>

              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageQuiz;
