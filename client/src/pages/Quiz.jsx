import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Quiz() {
  const { user, token } = useAuth();

  const [availableQuizzes, setAvailableQuizzes] = useState([]);
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

  const showToast = (msg, type = "info") => console.log(`[${type.toUpperCase()}] ${msg}`);

  /* 🧠 Fetch Quizzes with Attempt Info */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/quiz/status/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuizStatus(res.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch status", err);
        setLoading(false);
      }
    })();
  }, [token]);

  /* 🚫 Security & Anti-Cheat Setup */
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

    // Disable common actions
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
  }, [registered, submitted, autoSubmitted]);

  /* 🚀 Start Quiz */
  const startQuiz = async (quiz) => {
    if (quiz.attempted) {
      setResult({
        score: quiz.score,
        totalQuestions: quiz.totalQuestions,
        accuracy: ((quiz.score / quiz.totalQuestions) * 100).toFixed(2),
        earnedCoins: quiz.score * 5,
      });
      return;
    }

    setActiveQuiz(quiz);
    setAnswers(new Array(quiz.questions.length).fill(null));
    await document.documentElement.requestFullscreen();
    setRegistered(true);
    showToast("Quiz started in fullscreen", "success");
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
        await document.exitFullscreen();
      } catch (err) {
        console.error("Submit error:", err);
        showToast("Submission failed", "error");
      } finally {
        clearInterval(timerRef.current);
      }
    },
    [activeQuiz, answers, token]
  );

  /* ⏱ Timer Logic */
  useEffect(() => {
    if (!registered || submitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (index < activeQuiz.questions.length - 1) {
            setIndex((i) => i + 1);
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

  /* 🧱 UI Rendering */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-base sm:text-lg">
        Loading quizzes...
      </div>
    );

  // 🧭 Quiz List
  if (!activeQuiz && !result)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-teal-600 mb-4">
          Choose a Quiz
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
          {quizStatus.map((q) => (
            <div
              key={q._id}
              className={`p-5 rounded-xl shadow-md ${
                q.attempted
                  ? "bg-gray-100 dark:bg-gray-800 border-l-4 border-green-500"
                  : "bg-white dark:bg-gray-700 border-l-4 border-teal-500"
              }`}
            >
              <h3 className="font-semibold text-lg sm:text-xl text-teal-600 dark:text-teal-400">
                {q.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3">
                {q.description}
              </p>
              {q.attempted ? (
                <p className="text-green-600 font-medium text-sm sm:text-base">
                  ✅ Submitted — Score: {q.score}/{q.totalQuestions}
                </p>
              ) : (
                <button
                  onClick={() => startQuiz(q)}
                  className="px-4 py-2 sm:px-5 sm:py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm sm:text-base shadow-md"
                >
                  Start Quiz
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );

  // 🎯 Result
  if (result)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl max-w-md w-full">
          <h2 className="text-xl sm:text-2xl font-bold text-teal-600 mb-3">
            Your Result 🎯
          </h2>
          <p className="text-gray-700 dark:text-gray-200 text-sm sm:text-base">
            Correct: {result.score}/{result.totalQuestions}
          </p>
          <p className="text-gray-700 dark:text-gray-200 text-sm sm:text-base">
            Accuracy: {result.accuracy || ((result.score / result.totalQuestions) * 100).toFixed(2)}%
          </p>
          <p className="text-gray-700 dark:text-gray-200 text-sm sm:text-base">
            Coins Earned: 🪙 {result.earnedCoins}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-2">
            New Balance: {result.newBalance ?? "—"}
          </p>
        </div>
      </div>
    );

  // 🧩 Quiz UI
  const q = activeQuiz.questions[index];
  const progress = ((index + 1) / activeQuiz.questions.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 relative">
      {fullscreenWarning && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center px-6 z-50">
          <h2 className="text-lg sm:text-2xl mb-2">⚠️ Fullscreen Exited</h2>
          <p className="text-sm sm:text-base">
            Please re-enter fullscreen within 5 seconds or quiz will be auto-submitted.
          </p>
        </div>
      )}
      <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8">
        <div className="flex justify-between items-center mb-3 sm:mb-5">
          <h2 className="text-base sm:text-xl font-bold text-teal-600 dark:text-teal-400">
            {activeQuiz.title}
          </h2>
          <p className="font-semibold text-sm sm:text-base text-red-500">
            ⏱ {timeLeft}s
          </p>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full mb-4 overflow-hidden">
          <div
            className="h-2 bg-teal-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <h3 className="text-sm sm:text-lg font-semibold mb-3">
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
