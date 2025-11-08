import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  X,
} from "lucide-react";

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


}

/* ============================================================
   MANAGE QUIZZES PAGE (Create + Edit + List)
============================================================ */
function ManageQuiz() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Memoized headers to prevent ESLint hook warnings
  const adminHeaders = useMemo(() => ({ "X-Auth-Role": "admin" }), []);

  // Create form state (original create UI)
  const [form, setForm] = useState({
    title: "",
    description: "",
    questions: [
      { question: "", options: ["", "", "", ""], correctAnswerIndex: null, coins: 10 },
    ],
  });

  // Edit modal state
  const [editQuiz, setEditQuiz] = useState(null);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ✅ Stable fetchQuizzes with useCallback + memoized headers
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

  /* -----------------------
     CREATE FORM HANDLERS
  ----------------------- */
  const validateCreateForm = () => {
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
    if (!validateCreateForm()) return;
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        questions: form.questions.map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()),
          correctAnswer:
            q.correctAnswerIndex !== null ? q.options[q.correctAnswerIndex] : "",
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

  /* -----------------------
     LIST ACTIONS
  ----------------------- */
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

  const handleUnpublish = async (id) => {
    if (!window.confirm("Unpublish this quiz?")) return;
    try {
      await api.put(`/quiz/unpublish/${id}`, {}, { headers: adminHeaders });
      showToast("⚠️ Quiz unpublished.", "info");
      fetchQuizzes();
    } catch (err) {
      console.error("Unpublish failed:", err);
      showToast("❌ Unpublish failed.", "error");
    }
  };

  /* -----------------------
     EDIT: normalize / open modal
  ----------------------- */
  const openEditModal = (q) => {
    const normalized = {
      ...q,
      questions: (q.questions || []).map((qq) => {
        const index = qq.options.indexOf(qq.correctAnswer);
        return {
          question: qq.question || "",
          options: qq.options.length ? [...qq.options] : ["", "", "", ""],
          correctAnswerIndex: index >= 0 ? index : null,
          coins: qq.coins || 10,
        };
      }),
    };
    setEditQuiz(normalized);
  };

  /* -----------------------
     EDIT: save changes
  ----------------------- */
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editQuiz) return;
    if (!editQuiz.title?.trim()) return showToast("Title is required.", "error");
    for (const q of editQuiz.questions) {
      if (!q.question.trim()) return showToast("Each question needs text.", "error");
      if (!q.options.some((o) => o.trim()))
        return showToast("Each question needs at least one option.", "error");
      if (q.correctAnswerIndex === null)
        return showToast("Please select a correct answer.", "error");
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

  /* -----------------------
     RENDER SECTION
  ----------------------- */
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

export default ManageQuiz;
