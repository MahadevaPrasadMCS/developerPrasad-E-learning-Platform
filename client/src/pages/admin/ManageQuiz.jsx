import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

function ManageQuiz() {
  const { token, user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    questions: [
      { question: "", options: ["", "", "", ""], correctAnswer: "", coins: 10 },
    ],
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        { question: "", options: ["", "", "", ""], correctAnswer: "", coins: 10 },
      ],
    });
  };

  const handleQuestionChange = (qIdx, field, value) => {
    const questions = [...form.questions];
    if (field === "question" || field === "correctAnswer" || field === "coins") {
      questions[qIdx][field] = value;
    } else if (field.startsWith("option-")) {
      const optIdx = Number(field.split("-")[1]);
      questions[qIdx].options[optIdx] = value;
    }
    setForm({ ...form, questions });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        "/quiz/create",
        {
          title: form.title,
          description: form.description,
          questions: form.questions,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Quiz created successfully (Draft).");
      setForm({
        title: "",
        description: "",
        questions: [
          { question: "", options: ["", "", "", ""], correctAnswer: "", coins: 10 },
        ],
      });
      fetchQuizzes();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "❌ Quiz creation failed.");
    }
  };

  const handlePublish = async (id) => {
    const start = prompt("Enter start datetime (YYYY-MM-DDTHH:mm)");
    if (!start) return;
    const end = prompt("Enter end datetime (YYYY-MM-DDTHH:mm)");
    if (!end) return;

    try {
      await api.put(
        `/quiz/publish/${id}`,
        { startTime: start, endTime: end },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Quiz published successfully.");
      fetchQuizzes();
    } catch (err) {
      console.error(err);
      setMessage("❌ Publish failed.");
    }
  };

  const handleUnpublish = async (id) => {
    if (!window.confirm("Unpublish this quiz?")) return;
    try {
      await api.put(
        `/quiz/unpublish/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
      await api.delete(`/quiz/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("🗑️ Quiz deleted.");
      fetchQuizzes();
    } catch (err) {
      console.error(err);
      setMessage("❌ Delete failed.");
    }
  };

  if (user?.role !== "admin")
    return (
      <div className="text-center text-red-500 mt-10">
        Access denied — Admins only.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-10">
          🧩 Manage Quizzes
        </h1>

        {/* Quiz Creation Form */}
        <form
          onSubmit={handleCreate}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg p-8 mb-10"
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Create New Quiz (Draft)
          </h2>

          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Quiz Title"
            className="w-full p-3 mb-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            required
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full p-3 mb-5 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            rows={3}
          />

          {form.questions.map((q, qi) => (
            <div
              key={qi}
              className="mb-5 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
            >
              <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">
                Question {qi + 1}
              </h3>

              <textarea
                value={q.question}
                onChange={(e) =>
                  handleQuestionChange(qi, "question", e.target.value)
                }
                placeholder="Enter question"
                className="w-full p-2 mb-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                rows={2}
              />

              {q.options.map((opt, oi) => (
                <input
                  key={oi}
                  value={opt}
                  onChange={(e) =>
                    handleQuestionChange(qi, `option-${oi}`, e.target.value)
                  }
                  placeholder={`Option ${oi + 1}`}
                  className="w-full p-2 mb-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              ))}

              <input
                value={q.correctAnswer}
                onChange={(e) =>
                  handleQuestionChange(qi, "correctAnswer", e.target.value)
                }
                placeholder="Correct answer (must match one option)"
                className="w-full p-2 mb-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="number"
                min="0"
                value={q.coins}
                onChange={(e) =>
                  handleQuestionChange(qi, "coins", Number(e.target.value))
                }
                placeholder="Coins for this question"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          ))}

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-medium transition"
            >
              ➕ Add Question
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
            >
              💾 Create Quiz
            </button>
          </div>
        </form>

        {message && (
          <div className="text-center mb-6 text-teal-600 dark:text-teal-400 font-medium">
            {message}
          </div>
        )}

        {/* Existing Quizzes */}
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center">
          Existing Quizzes
        </h2>

        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Loading quizzes...
          </p>
        ) : quizzes.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No quizzes created yet.
          </p>
        ) : (
          <div className="space-y-5">
            {quizzes.map((q, index) => (
              <div
                key={q._id}
                className="flex justify-between flex-wrap items-start gap-3 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-md p-5 border-l-4 animate-fade-in"
                style={{
                  borderColor:
                    q.status === "draft"
                      ? "#facc15"
                      : q.status === "published"
                      ? "#10b981"
                      : "#6b7280",
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                    {q.title}{" "}
                    <span className="text-sm text-gray-500">({q.status})</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {q.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {new Date(q.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {q.status === "draft" ? (
                    <button
                      onClick={() => handlePublish(q._id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
                    >
                      Publish
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnpublish(q._id)}
                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition"
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(q._id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
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
