import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, PlayCircle } from "lucide-react";

function Quiz() {
  const { token } = useAuth();

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [registered, setRegistered] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizStatus, setQuizStatus] = useState([]);

  const timerRef = useRef(null);
  const fullscreenTimeout = useRef(null);

  const showToast = (msg, type = "info") => {
    console.log(`[${type.toUpperCase()}] ${msg}`);
    alert(msg);
  };

  /* 🧠 Fetch quizzes with attempt info */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/quiz/status/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuizStatus(res.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch quiz status:", err);
        showToast("Failed to load quizzes. Please try again later.", "error");
        setLoading(false);
      }
    })();
  }, [token]);

  /* 🚫 Security Setup */
  useEffect(() => {
    if (!registered) return;

    const prevent = (e) => e.preventDefault();
    const disableKeys = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
        showToast("Restricted during quiz", "warning");
      }
    };

    ["contextmenu", "copy", "cut", "paste"].forEach((evt) =>
      document.addEventListener(evt, prevent)
    );
    window.addEventListener("keydown", disableKeys);
    document.onselectstart = () => false;

    return () => {
      ["contextmenu", "copy", "cut", "paste"].forEach((evt) =>
        document.removeEventListener(evt, prevent)
      );
      window.removeEventListener("keydown", disableKeys);
      document.onselectstart = null;
    };
  }, [registered]);

  /* 🚀 Start Quiz */
const startQuiz = async (quiz) => {
  try {
    if (!quiz.questions?.length) {
      showToast("⚠️ This quiz has no questions yet. Please contact admin.", "warning");
      return;
    }

    // 🔹 Register user first
    await api.post(`/quiz/register/${quiz._id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    showToast("Registered successfully!", "success");

    setActiveQuiz(quiz);
    setAnswers(new Array(quiz.questions.length).fill(null));
    await document.documentElement.requestFullscreen();
    setRegistered(true);
    showToast("Quiz started in fullscreen mode!", "success");
  } catch (err) {
    console.error("Registration failed:", err);
    showToast("Registration failed. Try again later.", "error");
  }
};


  /* 📝 Submit Quiz */
  const handleSubmit = useCallback(
    async (auto = false) => {
      try {
        const res = await api.post(
          `/quiz/submit/${activeQuiz._id}`,
          { answers },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setResult(res.data);
        setSubmitted(true);
        setAutoSubmitted(auto);

        // 🎯 Fetch quiz analytics
        try {
          const analyticsRes = await api.get(`/quiz/${activeQuiz._id}/analytics`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setResult((prev) => ({
            ...prev,
            averageScore: analyticsRes.data.averageScore?.toFixed(2),
            successRate: analyticsRes.data.successRate?.toFixed(2),
          }));
        } catch (err) {
          console.warn("Analytics fetch failed:", err.message);
        }

        if (document.fullscreenElement) await document.exitFullscreen();
      } catch (err) {
        console.error("Submit error:", err);
        showToast("Submission failed. Try again.", "error");
      } finally {
        clearInterval(timerRef.current);
      }
    },
    [activeQuiz, answers, token]
  );

  /* 🚨 Fullscreen Exit Watcher */
  useEffect(() => {
    if (!registered) return;

    const handleExit = () => {
      if (!document.fullscreenElement && !autoSubmitted && !submitted) {
        setFullscreenWarning(true);
        fullscreenTimeout.current = setTimeout(() => {
          setFullscreenWarning(false);
          handleSubmit(true);
        }, 5000);
      } else {
        clearTimeout(fullscreenTimeout.current);
        setFullscreenWarning(false);
      }
    };

    document.addEventListener("fullscreenchange", handleExit);
    return () => document.removeEventListener("fullscreenchange", handleExit);
  }, [registered, submitted, autoSubmitted, handleSubmit]);

  /* ⏱ Timer */
  useEffect(() => {
    if (!registered || submitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (index < activeQuiz.questions.length - 1) {
            setIndex((i) => i + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return 30;
          } else {
            handleSubmit();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [registered, index, activeQuiz, submitted, handleSubmit]);

  /* 🧱 Loading State */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-base sm:text-lg">
        Loading quizzes...
      </div>
    );

  /* 🧭 Quiz List */
  if (!activeQuiz && !result)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-teal-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <h2 className="text-3xl font-bold text-teal-600 mb-8 text-center">
          Choose a Quiz
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
          {quizStatus.map((q) => (
            <div
              key={q._id}
              className={`p-5 sm:p-6 rounded-xl shadow-md border transition-all duration-300 hover:shadow-xl ${
                q.attempted
                  ? "bg-gray-900 border-green-600"
                  : "bg-gray-800 border-teal-500 hover:border-teal-400"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                  <PlayCircle className="text-teal-400" size={20} />
                  {q.title}
                </h3>
              </div>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                {q.description || "No description available."}
              </p>

              {q.attempted ? (
                <div className="flex items-center gap-2 text-green-400 font-medium text-sm">
                  <CheckCircle2 size={16} />
                  Submitted — <span className="ml-1">Score: {q.score}/{q.totalQuestions}</span>
                </div>
              ) : (
                <button
                  onClick={() => startQuiz(q)}
                  className="w-full mt-2 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg"
                >
                  Start Quiz
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );

  /* 🎯 Result */
  if (result)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-gradient-to-br from-teal-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <h2 className="text-2xl font-bold text-teal-600 mb-3">Your Result 🎯</h2>
          <p className="text-gray-700 dark:text-gray-200 text-base">
            Correct: {result.score}/{result.totalQuestions}
          </p>
          <p className="text-gray-700 dark:text-gray-200 text-base">
            Accuracy: {result.accuracy || ((result.score / result.totalQuestions) * 100).toFixed(2)}%
          </p>
          <p className="text-gray-700 dark:text-gray-200 text-base">
            Coins Earned: 🪙 {result.earnedCoins}
          </p>

          {result.averageScore && (
            <div className="mt-3 border-t border-gray-300 dark:border-gray-600 pt-2 text-sm text-gray-500 dark:text-gray-400">
              Avg Score: <span className="font-semibold text-teal-500">{result.averageScore}%</span> | 
              Success Rate: <span className="font-semibold text-green-500">{result.successRate}%</span>
            </div>
          )}

          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            New Balance: {result.newBalance ?? "—"}
          </p>
        </div>
      </div>
    );

  /* 🧩 Defensive Guard */
  if (!activeQuiz?.questions || activeQuiz.questions.length === 0)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 dark:text-gray-300">
        Quiz data unavailable. Please try again later.
      </div>
    );

  /* 🧩 Quiz UI */
  const q = activeQuiz.questions[index];
  const progress = ((index + 1) / activeQuiz.questions.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 relative">
      {fullscreenWarning && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center px-6 z-50">
          <h2 className="text-lg sm:text-2xl mb-2">⚠️ Fullscreen Exited</h2>
          <p className="text-sm sm:text-base">
            Please re-enter fullscreen within 5 seconds or the quiz will be auto-submitted.
          </p>
        </div>
      )}

      <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8">
        <div className="flex justify-between items-center mb-3 sm:mb-5">
          <h2 className="text-base sm:text-xl font-bold text-teal-600 dark:text-teal-400">
            {activeQuiz.title}
          </h2>
          <p className="font-semibold text-sm sm:text-base text-red-500">⏱ {timeLeft}s</p>
        </div>

        <div className="w-full bg-gray-200 h-2 rounded-full mb-4 overflow-hidden">
          <div
            className="h-2 bg-teal-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <h3 className="text-sm sm:text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
          {q.question}
        </h3>

        <div className="space-y-2 sm:space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                const updated = [...answers];
                updated[index] = i;
                setAnswers(updated);
              }}
              className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-all ${
                answers[index] === i
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white hover:bg-teal-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-5">
          <button
            onClick={() => {
              if (index === activeQuiz.questions.length - 1) handleSubmit();
              else {
                setIndex((i) => i + 1);
                setTimeLeft(30);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            disabled={answers[index] === null}
            className={`px-5 py-2 sm:px-6 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base ${
              answers[index] === null
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
          >
            {index === activeQuiz.questions.length - 1 ? "Submit" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
