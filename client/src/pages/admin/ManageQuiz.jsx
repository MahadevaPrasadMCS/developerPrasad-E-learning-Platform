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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        "/quiz/create",
        form,
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
      setMessage("❌ Quiz creation failed.");
    }
  };

  const handleUnpublish = async (id) => {
    if (!window.confirm("Unpublish this quiz?")) return;
    try {
      await api.put(`/quiz/unpublish/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("⚠️ Quiz unpublished.");
      fetchQuizzes();
    } catch {
      setMessage("❌ Unpublish failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz permanently?")) return;
    try {
      await api.delete(`/quiz/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("🗑️ Quiz deleted.");
      fetchQuizzes();
    } catch {
      setMessage("❌ Delete failed.");
    }
  };

  if (user?.role !== "admin")
    return <div className="text-center text-red-500 mt-10">Access denied.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-teal-600 mb-10">
          🧩 Manage Quizzes
        </h1>

        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-10"
        >
          <h2 className="text-2xl font-semibold mb-4">Create New Quiz</h2>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Quiz Title"
            className="w-full p-3 mb-3 border rounded-lg"
            required
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            className="w-full p-3 mb-5 border rounded-lg"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold"
          >
            💾 Create Quiz
          </button>
        </form>

        {message && (
          <p className="text-center mb-6 text-teal-600 font-medium">{message}</p>
        )}

        <h2 className="text-2xl font-semibold mb-6 text-center">Existing Quizzes</h2>
        {loading ? (
          <p className="text-center">Loading quizzes...</p>
        ) : quizzes.length === 0 ? (
          <p className="text-center">No quizzes created yet.</p>
        ) : (
          quizzes.map((q) => (
            <div
              key={q._id}
              className="flex justify-between flex-wrap bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 mb-4 border-l-4"
              style={{
                borderColor:
                  q.status === "published" ? "#10b981" : "#facc15",
              }}
            >
              <div>
                <h3 className="font-semibold">{q.title}</h3>
                <p className="text-sm text-gray-500">{q.description}</p>
                {q.status === "published" && (
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
          ))
        )}
      </div>
    </div>
  );
}

export default ManageQuiz;
