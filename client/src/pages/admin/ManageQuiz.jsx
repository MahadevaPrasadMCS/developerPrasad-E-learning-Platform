// client/src/pages/admin/ManageQuiz.jsx
import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

function PublishControls({ quiz, onSuccess }) {
  const [isScheduling, setIsScheduling] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePublishNow = async () => {
    try {
      setLoading(true);
      await api.put(`/quiz/publish/${quiz._id}`, {
        startTime: new Date().toISOString(),
        endTime: null,
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Publish failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!startTime || !endTime)
      return alert("Please set both start and end times");
    if (new Date(startTime) >= new Date(endTime))
      return alert("End time must be after start time");
    try {
      setLoading(true);
      await api.put(`/quiz/publish/${quiz._id}`, { startTime, endTime });
      onSuccess();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Scheduling failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {!isScheduling ? (
        <>
          <button
            onClick={handlePublishNow}
            disabled={loading}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md"
          >
            {loading ? "Publishing..." : "Publish Now"}
          </button>
          <button
            onClick={() => setIsScheduling(true)}
            className="ml-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Schedule Publish
          </button>
        </>
      ) : (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={handleSchedule}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            {loading ? "Scheduling..." : "Confirm"}
          </button>
          <button
            onClick={() => setIsScheduling(false)}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function ManageQuiz() {
  const { token, user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswerIndex: null, // store index of correct option
        coins: 10,
      },
    ],
  });

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/quiz/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Form helpers (questions & options) ---------- */
  const handleAddQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question: "", options: ["", "", "", ""], correctAnswerIndex: null, coins: 10 },
      ],
    }));
  };

  const handleRemoveQuestion = (qIdx) => {
    setForm((prev) => {
      const questions = prev.questions.filter((_, i) => i !== qIdx);
      return { ...prev, questions: questions.length ? questions : [
        { question: "", options: ["", "", "", ""], correctAnswerIndex: null, coins: 10 }
      ] };
    });
  };

  const handleQuestionChange = (qIdx, field, value) => {
    setForm((prev) => {
      const questions = [...prev.questions];
      if (field === "question" || field === "coins") {
        questions[qIdx][field] = value;
      } else if (field.startsWith("option-")) {
        const optIdx = Number(field.split("-")[1]);
        questions[qIdx].options[optIdx] = value;
        // If editing an option that was marked correct and text becomes empty, clear correctAnswerIndex
        if (questions[qIdx].correctAnswerIndex === optIdx && !value) {
          questions[qIdx].correctAnswerIndex = null;
        }
      } else if (field === "correctIndex") {
        questions[qIdx].correctAnswerIndex = value === null ? null : Number(value);
      }
      return { ...prev, questions };
    });
  };

  const handleAddOption = (qIdx) => {
    setForm((prev) => {
      const questions = [...prev.questions];
      questions[qIdx].options.push("");
      return { ...prev, questions };
    });
  };

  const handleRemoveOption = (qIdx, optIdx) => {
    setForm((prev) => {
      const questions = [...prev.questions];
      const opts = questions[qIdx].options.filter((_, i) => i !== optIdx);
      // adjust correctAnswerIndex if necessary
      if (questions[qIdx].correctAnswerIndex !== null) {
        if (questions[qIdx].correctAnswerIndex === optIdx) {
          questions[qIdx].correctAnswerIndex = null;
        } else if (questions[qIdx].correctAnswerIndex > optIdx) {
          questions[qIdx].correctAnswerIndex -= 1;
        }
      }
      questions[qIdx].options = opts.length ? opts : [""];
      return { ...prev, questions };
    });
  };

  /* ---------- Create quiz ---------- */
  const validateForm = () => {
    if (!form.title.trim()) {
      setMessage("Title is required.");
      return false;
    }
    if (!form.questions.length) {
      setMessage("Add at least one question.");
      return false;
    }
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.question.trim()) {
        setMessage(`Question ${i + 1} text is required.`);
        return false;
      }
      if (!q.options.some((o) => o && o.trim())) {
        setMessage(`Question ${i + 1} must have at least one non-empty option.`);
        return false;
      }
      if (q.correctAnswerIndex === null || q.options[q.correctAnswerIndex] === "" || q.options[q.correctAnswerIndex] == null) {
        setMessage(`Question ${i + 1} must have a valid correct answer selected.`);
        return false;
      }
      if (isNaN(Number(q.coins)) || Number(q.coins) < 0) {
        setMessage(`Question ${i + 1} coins must be a non-negative number.`);
        return false;
      }
    }
    return true;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!validateForm()) return;
    try {
      // Transform to backend shape: correctAnswer as text
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || "",
        questions: form.questions.map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => (o ? String(o).trim() : "")),
          correctAnswer: q.correctAnswerIndex !== null ? String(q.options[q.correctAnswerIndex]).trim() : "",
          coins: Number(q.coins) || 0,
        })),
      };

      await api.post("/quiz/create", payload, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("✅ Quiz created successfully (Draft).");
      // reset form
      setForm({
        title: "",
        description: "",
        questions: [
          { question: "", options: ["", "", "", ""], correctAnswerIndex: null, coins: 10 },
        ],
      });
      fetchQuizzes();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "❌ Quiz creation failed.");
    }
  };

  /* ---------- Admin actions ---------- */
  const handleUnpublish = async (id) => {
    if (!window.confirm("Unpublish this quiz?")) return;
    try {
      await api.put(`/quiz/unpublish/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("⚠️ Quiz unpublished.");
      fetchQuizzes();
    } catch (err) {
      console.error(err);
      setMessage("❌ Unpublish failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz permanently?")) return;
    try {
      await api.delete(`/quiz/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("🗑️ Quiz deleted.");
      fetchQuizzes();
    } catch (err) {
      console.error(err);
      setMessage("❌ Delete failed.");
    }
  };

  if (user?.role !== "admin")
    return <div className="text-center text-red-500 mt-10">Access denied.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-teal-600 mb-6">
          🧩 Manage Quizzes
        </h1>

        {/* Create form */}
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Create New Quiz (Draft)</h2>

          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Quiz Title"
            className="w-full p-3 mb-3 border rounded-lg"
            required
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description (optional)"
            className="w-full p-3 mb-5 border rounded-lg"
            rows={2}
          />

          {/* Questions builder */}
          <div className="space-y-4">
            {form.questions.map((q, qi) => (
              <div key={qi} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">Question {qi + 1}</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddOption(qi)}
                      className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                    >
                      + Option
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qi)}
                      className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <textarea
                  value={q.question}
                  onChange={(e) => handleQuestionChange(qi, "question", e.target.value)}
                  placeholder="Question text"
                  className="w-full p-2 mb-3 border rounded"
                  rows={2}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correctAnswerIndex === oi}
                        onChange={() => handleQuestionChange(qi, "correctIndex", oi)}
                        className="w-4 h-4"
                      />
                      <input
                        value={opt}
                        onChange={(e) => handleQuestionChange(qi, `option-${oi}`, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                        className="flex-1 p-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(qi, oi)}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 items-center">
                  <label className="text-sm">Coins:</label>
                  <input
                    type="number"
                    min="0"
                    value={q.coins}
                    onChange={(e) => handleQuestionChange(qi, "coins", e.target.value)}
                    className="w-24 p-2 border rounded"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              ➕ Add Question
            </button>

            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
            >
              💾 Create Quiz
            </button>

            <div className="ml-auto text-sm text-gray-500 self-center">
              {form.questions.length} question(s)
            </div>
          </div>
        </form>

        {message && (
          <p className="text-center mb-6 text-teal-600 font-medium">{message}</p>
        )}

        {/* Existing Quizzes */}
        <h2 className="text-2xl font-semibold mb-4 text-center">Existing Quizzes</h2>

        {loading ? (
          <p className="text-center">Loading quizzes...</p>
        ) : quizzes.length === 0 ? (
          <p className="text-center">No quizzes created yet.</p>
        ) : (
          <div className="space-y-4">
            {quizzes.map((q) => (
              <div
                key={q._id}
                className="flex justify-between flex-wrap bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border-l-4"
                style={{ borderColor: q.status === "published" ? "#10b981" : "#facc15" }}
              >
                <div>
                  <h3 className="font-semibold">{q.title}</h3>
                  <p className="text-sm text-gray-500">{q.description}</p>
                  {q.status === "published" && q.endTime && (
                    <p className="text-xs text-gray-400 mt-1">
                      Active until {new Date(q.endTime).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {q.status === "draft" ? (
                    <PublishControls
                      quiz={q}
                      onSuccess={() => {
                        setMessage("✅ Quiz published successfully.");
                        fetchQuizzes();
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => handleUnpublish(q._id)}
                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md"
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(q._id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageQuiz;
