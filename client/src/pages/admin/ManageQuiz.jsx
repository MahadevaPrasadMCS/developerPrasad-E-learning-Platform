import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import {
  Trash,
  Edit,
  Clock,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ============================================================
   Reusable Publish Controls (Admin)
============================================================ */
function PublishControls({ quiz, onSuccess, showToast }) {
  const [isScheduling, setIsScheduling] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const publish = async (data, successMsg) => {
    try {
      setLoading(true);
      await api.put(`/quiz/admin/publish/${quiz._id}`, data);
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
      await api.put(`/quiz/admin/unpublish/${quiz._id}`);
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
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000); // +1 day
    publish(
      {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      "✅ Quiz published successfully!"
    );
  };

  const handleSchedule = () => {
    if (!startTime || !endTime) {
      showToast("Please set both start and end times.", "error");
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      showToast("End time must be after start time.", "error");
      return;
    }
    publish(
      { startTime, endTime },
      "✅ Quiz scheduled successfully!"
    );
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2 items-center">
      {quiz.status === "published" ? (
        <button
          onClick={unpublish}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-sm transition-all text-xs sm:text-sm"
        >
          {loading ? "Unpublishing..." : "Unpublish"}
        </button>
      ) : !isScheduling ? (
        <>
          <button
            onClick={handlePublishNow}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm transition-all text-xs sm:text-sm"
          >
            <CheckCircle2 size={14} />
            {loading ? "Publishing..." : "Publish Now"}
          </button>

          <button
            onClick={() => setIsScheduling(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all text-xs sm:text-sm"
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
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm"
          />
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm"
          />
          <button
            onClick={handleSchedule}
            disabled={loading}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md shadow-sm transition-all text-xs sm:text-sm"
          >
            {loading ? "Scheduling..." : "Confirm"}
          </button>
          <button
            onClick={() => setIsScheduling(false)}
            className="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200 transition-all text-xs sm:text-sm"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}

/* ============================================================
   MANAGE QUIZZES (CRUD + Publish/Unpublish) – ADMIN ONLY
============================================================ */
function ManageQuiz() {
  const { user } = useAuth();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswerIndex: null,
        coins: 10,
      },
    ],
  });

  const [editQuiz, setEditQuiz] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const PAGE_SIZE = 6;

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const fetchQuizzes = useCallback(
    async (pageToLoad = 1) => {
      try {
        setLoading(true);
        const res = await api.get("/quiz/admin/list", {
          params: { page: pageToLoad, limit: PAGE_SIZE },
        });

        const data = res.data || {};
        setQuizzes(data.quizzes || []);
        setTotalPages(data.totalPages || 1);
        setTotalQuizzes(data.totalQuizzes || 0);
        setPage(data.currentPage || pageToLoad);
      } catch (err) {
        console.error("Fetch quizzes failed:", err);
        showToast("❌ Failed to load quizzes.", "error");
      } finally {
        setLoading(false);
      }
    },
    [PAGE_SIZE]
  );

  useEffect(() => {
    fetchQuizzes(1);
  }, [fetchQuizzes]);

  /* ===========================
     Create Quiz
  ============================ */

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      showToast("Title is required.", "error");
      return;
    }

    if (!form.questions.length) {
      showToast("At least one question is required.", "error");
      return;
    }

    for (const q of form.questions) {
      if (!q.question.trim()) {
        showToast("Each question needs text.", "error");
        return;
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        showToast("Each question needs at least 2 options.", "error");
        return;
      }
      if (q.correctAnswerIndex === null || q.correctAnswerIndex < 0) {
        showToast("Please select a correct answer for each question.", "error");
        return;
      }
      if (!q.options[q.correctAnswerIndex]?.trim()) {
        showToast("Correct answer option cannot be empty.", "error");
        return;
      }
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

      await api.post("/quiz/admin/create", payload);
      showToast("✅ Quiz created successfully (Draft).", "success");

      setForm({
        title: "",
        description: "",
        questions: [
          {
            question: "",
            options: ["", "", "", ""],
            correctAnswerIndex: null,
            coins: 10,
          },
        ],
      });

      fetchQuizzes(page); // reload current page
    } catch (err) {
      console.error("Quiz creation failed:", err);
      showToast(
        err.response?.data?.message || "❌ Quiz creation failed.",
        "error"
      );
    }
  };

  /* ===========================
     Delete Quiz
  ============================ */

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/quiz/admin/${deleteTarget._id}`);
      showToast("🗑️ Quiz deleted successfully.", "success");

      // If deleting last item on last page, shift page backward
      const remaining = totalQuizzes - 1;
      const newTotalPages = Math.max(Math.ceil(remaining / PAGE_SIZE), 1);
      const nextPage = page > newTotalPages ? newTotalPages : page;

      setDeleteTarget(null);
      fetchQuizzes(nextPage);
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("❌ Failed to delete quiz.", "error");
    }
  };

  /* ===========================
     Edit Quiz
  ============================ */

  const openEditModal = (q) => {
    const normalized = {
      _id: q._id,
      title: q.title || "",
      description: q.description || "",
      questions: (q.questions || []).map((qq) => {
        const correctIndex = qq.options?.indexOf(qq.correctAnswer);
        return {
          question: qq.question || "",
          options: Array.isArray(qq.options) && qq.options.length
            ? [...qq.options]
            : ["", "", "", ""],
          correctAnswerIndex: correctIndex >= 0 ? correctIndex : 0,
          coins: qq.coins || 10,
        };
      }),
    };
    setEditQuiz(normalized);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editQuiz) return;

    if (!editQuiz.title.trim()) {
      showToast("Title is required.", "error");
      return;
    }
    if (!editQuiz.questions.length) {
      showToast("At least one question is required.", "error");
      return;
    }

    for (const q of editQuiz.questions) {
      if (!q.question.trim()) {
        showToast("Each question needs text.", "error");
        return;
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        showToast("Each question needs at least 2 options.", "error");
        return;
      }
      if (q.correctAnswerIndex === null || q.correctAnswerIndex < 0) {
        showToast("Please select a correct answer for each question.", "error");
        return;
      }
      if (!q.options[q.correctAnswerIndex]?.trim()) {
        showToast("Correct answer option cannot be empty.", "error");
        return;
      }
    }

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

      await api.put(`/quiz/admin/${editQuiz._id}`, payload);
      showToast("✅ Quiz updated successfully!", "success");
      setEditQuiz(null);
      fetchQuizzes(page);
    } catch (err) {
      console.error("Update failed:", err);
      showToast(
        err.response?.data?.message || "❌ Failed to update quiz.",
        "error"
      );
    }
  };

  /* ===========================
     Pagination UI
  ============================ */

  const pagesArray = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= totalPages; i++) arr.push(i);
    return arr;
  }, [totalPages]);

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    fetchQuizzes(p);
  };

  /* ===========================
     Guard: Admin Only
  ============================ */

  if (user?.role !== "admin") {
    return (
      <p className="text-center text-red-500 mt-10">
        Access denied — Admins only.
      </p>
    );
  }

  /* ===========================
     Render
  ============================ */

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-teal-600 mb-6">
        🧠 Manage Quizzes
      </h2>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded-md shadow-md text-sm z-50 transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-gray-800 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Create Quiz Form */}
      <form
        onSubmit={handleCreate}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-10 space-y-6 border border-gray-200/70 dark:border-gray-700/60"
      >
        <h3 className="text-2xl font-semibold text-teal-600">
          Create New Quiz
        </h3>

        <input
          type="text"
          placeholder="Quiz Title"
          value={form.title}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, title: e.target.value }))
          }
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500"
        />
        <textarea
          placeholder="Quiz Description (optional)"
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500"
        ></textarea>

        {form.questions.map((q, qIdx) => (
          <div
            key={qIdx}
            className="border p-4 rounded-xl dark:border-gray-600 mb-4 bg-gray-50/60 dark:bg-gray-900/40"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-700 dark:text-gray-200">
                Question {qIdx + 1}
              </h4>
              {form.questions.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      questions: prev.questions.filter(
                        (_, i) => i !== qIdx
                      ),
                    }))
                  }
                  className="text-red-500 hover:text-red-600 flex items-center gap-1 text-xs"
                >
                  <Trash size={14} /> Remove
                </button>
              )}
            </div>

            <textarea
              placeholder="Enter your question..."
              rows={3}
              value={q.question}
              onChange={(e) =>
                setForm((prev) => {
                  const updated = [...prev.questions];
                  updated[qIdx].question = e.target.value;
                  return { ...prev, questions: updated };
                })
              }
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-3"
            />

            <div className="grid gap-2 mb-3">
              {q.options.map((opt, oIdx) => (
                <div
                  key={oIdx}
                  className="flex items-center gap-2 mb-1 last:mb-0"
                >
                  <input
                    type="radio"
                    checked={q.correctAnswerIndex === oIdx}
                    onChange={() =>
                      setForm((prev) => {
                        const updated = [...prev.questions];
                        updated[qIdx].correctAnswerIndex = oIdx;
                        return { ...prev, questions: updated };
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder={`Option ${oIdx + 1}`}
                    value={opt}
                    onChange={(e) =>
                      setForm((prev) => {
                        const updated = [...prev.questions];
                        updated[qIdx].options[oIdx] = e.target.value;
                        return { ...prev, questions: updated };
                      })
                    }
                    className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => {
                          const updated = [...prev.questions];
                          updated[qIdx].options.splice(oIdx, 1);
                          if (
                            updated[qIdx].correctAnswerIndex === oIdx
                          ) {
                            updated[qIdx].correctAnswerIndex = null;
                          }
                          return { ...prev, questions: updated };
                        })
                      }
                      className="text-red-500 hover:text-red-600 text-xs"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setForm((prev) => {
                  const updated = [...prev.questions];
                  updated[qIdx].options.push("");
                  return { ...prev, questions: updated };
                })
              }
              className="text-teal-600 hover:text-teal-700 text-sm"
            >
              + Add Option
            </button>

            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                Coins per correct answer:
              </label>
              <input
                type="number"
                min={1}
                value={q.coins}
                onChange={(e) =>
                  setForm((prev) => {
                    const updated = [...prev.questions];
                    updated[qIdx].coins = Number(e.target.value) || 0;
                    return { ...prev, questions: updated };
                  })
                }
                className="w-20 p-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-xs"
              />
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                questions: [
                  ...prev.questions,
                  {
                    question: "",
                    options: ["", "", "", ""],
                    correctAnswerIndex: null,
                    coins: 10,
                  },
                ],
              }))
            }
            className="px-4 py-2 bg-slate-100 text-teal-700 rounded-md hover:bg-slate-200 text-sm"
          >
            + Add Question
          </button>

          <button
            type="submit"
            className="flex-1 sm:flex-none sm:px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-lg text-sm sm:text-base text-center"
          >
            Create Quiz
          </button>
        </div>
      </form>

      {/* Quiz List */}
      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400">
          Loading quizzes...
        </div>
      ) : quizzes.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No quizzes found.
        </p>
      ) : (
        <>
          <div className="space-y-6 mb-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-md border border-gray-200/70 dark:border-gray-700/60 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-teal-600 text-lg truncate">
                    {quiz.title}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {quiz.description || "No description provided."}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Status:{" "}
                    {quiz.status === "published" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        Draft
                      </span>
                    )}
                  </p>

                  {quiz.startTime && quiz.endTime && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(quiz.startTime).toLocaleString()} →{" "}
                      {new Date(quiz.endTime).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-3">
                    <button
                      onClick={() => openEditModal(quiz)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(quiz)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs sm:text-sm"
                    >
                      <Trash size={16} /> Delete
                    </button>
                  </div>

                  <PublishControls
                    quiz={quiz}
                    showToast={showToast}
                    onSuccess={() => fetchQuizzes(page)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className={`p-2 rounded-full border text-sm flex items-center justify-center ${
                  page <= 1
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              {pagesArray.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`px-3 py-1.5 rounded-md text-sm border ${
                    p === page
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className={`p-2 rounded-full border text-sm flex items-center justify-center ${
                  page >= totalPages
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500 text-center">
            Showing page {page} of {totalPages} — {totalQuizzes} quiz
            {totalQuizzes !== 1 ? "zes" : ""}
          </p>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-200/70 dark:border-gray-700/60">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Delete Quiz
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">
              Are you sure you want to permanently delete the quiz{" "}
              <span className="font-semibold">
                “{deleteTarget.title}”
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
              >
                <Trash size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quiz Modal */}
      {editQuiz && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-3xl relative overflow-y-auto max-h-[90vh] border border-gray-200/70 dark:border-gray-700/60">
            <button
              onClick={() => setEditQuiz(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-semibold text-teal-600 mb-4">
              Edit Quiz
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <input
                type="text"
                value={editQuiz.title}
                onChange={(e) =>
                  setEditQuiz((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <textarea
                value={editQuiz.description}
                onChange={(e) =>
                  setEditQuiz((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              ></textarea>

              {editQuiz.questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="border p-4 rounded-xl dark:border-gray-600 mb-3 bg-gray-50/70 dark:bg-gray-900/40"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Question {qIdx + 1}
                    </p>
                  </div>

                  <textarea
                    rows={3}
                    value={q.question}
                    onChange={(e) =>
                      setEditQuiz((prev) => {
                        const updated = [...prev.questions];
                        updated[qIdx].question = e.target.value;
                        return { ...prev, questions: updated };
                      })
                    }
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-2"
                  />
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className="flex items-center gap-2 mb-2"
                    >
                      <input
                        type="radio"
                        checked={q.correctAnswerIndex === oIdx}
                        onChange={() =>
                          setEditQuiz((prev) => {
                            const updated = [...prev.questions];
                            updated[qIdx].correctAnswerIndex = oIdx;
                            return { ...prev, questions: updated };
                          })
                        }
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          setEditQuiz((prev) => {
                            const updated = [...prev.questions];
                            updated[qIdx].options[oIdx] =
                              e.target.value;
                            return { ...prev, questions: updated };
                          })
                        }
                        className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  ))}

                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Coins per correct answer:
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={q.coins}
                      onChange={(e) =>
                        setEditQuiz((prev) => {
                          const updated = [...prev.questions];
                          updated[qIdx].coins =
                            Number(e.target.value) || 0;
                          return { ...prev, questions: updated };
                        })
                      }
                      className="w-20 p-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-xs"
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditQuiz(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm"
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
