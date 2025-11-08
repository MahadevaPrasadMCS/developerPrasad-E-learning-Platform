import React, { useEffect, useState, useCallback } from "react";
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
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Toast helper
  const showToast = (msg, type = "info") => {
    console.log(`📢 Toast (${type}):`, msg);
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* =========================================================
  🧠 FETCH QUIZZES + ATTEMPTS (Debug-Friendly)
  ========================================================= */
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        console.log("📡 Fetching active quizzes...");
        const res = await api.get("/quiz/active");
        const active = Array.isArray(res.data) ? res.data : [res.data];
        if (!active.length) {
          console.warn("⚠️ No active quizzes found");
          return setActiveQuiz(null);
        }

        // Logged-in user handling
        if (user && token) {
          let attempts = [];
          try {
            const attRes = await api.get("/quiz/attempts/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            attempts = attRes.data || [];
            console.log("✅ Attempts fetched:", attempts);
          } catch (err) {
            if (err.response?.status === 403) {
              console.warn("⚠️ User not authorized for attempts (admin or restricted).");
            } else {
              console.error("❌ Attempt fetch failed:", err);
              showToast("Failed to fetch attempts. Check console logs.", "error");
            }
          }

          // Filter out already attempted quizzes
          const unattempted = active.filter(
            (q) => !attempts.some((a) => String(a.quizId?._id) === String(q._id))
          );

          if (ignore) return;

          if (unattempted.length > 1) {
            setAvailableQuizzes(unattempted);
            console.log("🧩 Multiple unattempted quizzes available:", unattempted);
          } else if (unattempted.length === 1) {
            setActiveQuiz(unattempted[0]);
            setAnswers(new Array(unattempted[0].questions.length).fill(null));
          } else {
            console.log("✅ All active quizzes already attempted.");
            setActiveQuiz(null);
          }
        } else {
          console.log("👤 Guest user detected — showing all active quizzes");
          setAvailableQuizzes(active);
        }
      } catch (err) {
        console.error("⚠️ Quiz fetch error:", err);
        showToast("Failed to load quizzes.", "error");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => (ignore = true);
  }, [user, token]);

  /* =========================================================
  🚀 ENTER FULLSCREEN & REGISTER
  ========================================================= */
  const startQuiz = async () => {
    try {
      if (!token) return showToast("⚠️ Please login to start the quiz.", "error");

      console.log("🎬 Starting quiz:", activeQuiz?._id);
      await api.post(`/quiz/register/${activeQuiz._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        showToast("🔒 Fullscreen mode enabled — Exam started", "success");
      }

      setRegistered(true);
      setTimeLeft(30);
    } catch (err) {
      console.error("❌ Registration error:", err);
      showToast(err.response?.data?.message || "Quiz registration failed.", "error");
    }
  };

  /* =========================================================
  📝 SUBMIT QUIZ
  ========================================================= */
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (autoSubmitted || !activeQuiz || !token) return;

      try {
        console.log("📤 Submitting quiz:", activeQuiz._id);
        const res = await api.post(
          `/quiz/submit/${activeQuiz._id}`,
          { answers },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const payload = res.data;
        setResult({
          score: payload.score,
          totalQuestions: payload.totalQuestions,
          earnedCoins: payload.earnedCoins,
          newBalance: payload.newBalance,
        });

        setSubmitted(true);
        setAutoSubmitted(auto);
        showToast(auto ? "⏱️ Auto-submitted (rule violation)" : "✅ Quiz submitted!", "success");
        console.log("✅ Quiz submitted successfully:", payload);
      } catch (err) {
        console.error("❌ Submit error:", err);
        showToast(err.response?.data?.message || "Error submitting quiz.", "error");
      } finally {
        if (document.fullscreenElement) document.exitFullscreen();
      }
    },
    [token, activeQuiz, answers, autoSubmitted]
  );

  /* =========================================================
  ⏱️ TIMER LOGIC
  ========================================================= */
  useEffect(() => {
    if (!registered || submitted || !activeQuiz) return;

    if (timeLeft <= 0) {
      if (index < activeQuiz.questions.length - 1) {
        setIndex((i) => i + 1);
        setTimeLeft(30);
      } else handleSubmit();
      return;
    }

    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, index, registered, submitted, activeQuiz, handleSubmit]);

  /* =========================================================
  🚫 RULE ENFORCEMENT (Tab switch / Fullscreen exit)
  ========================================================= */
  useEffect(() => {
    if (!registered || submitted || !activeQuiz) return;
    let hideTimer;

    const handleVisibility = () => {
      if (document.hidden && !autoSubmitted) {
        console.warn("🚨 Tab hidden — possible cheating detected.");
        hideTimer = setTimeout(() => {
          if (document.hidden && !autoSubmitted) handleSubmit(true);
        }, 3000);
      } else clearTimeout(hideTimer);
    };

    const handleFullscreenExit = async () => {
      if (!document.fullscreenElement && !autoSubmitted && !submitted) {
        console.warn("🚨 Fullscreen exited — auto-submitting quiz.");
        await handleSubmit(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreenExit);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreenExit);
      clearTimeout(hideTimer);
    };
  }, [registered, submitted, activeQuiz, handleSubmit, autoSubmitted]);

  /* =========================================================
  🔒 DISABLE SHORTCUTS + CONTEXT MENU
  ========================================================= */
  useEffect(() => {
    if (!registered || submitted) return;
    const disableContext = (e) => e.preventDefault();
    const blockKeys = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key === "F12") e.preventDefault();
    };
    document.addEventListener("contextmenu", disableContext);
    window.addEventListener("keydown", blockKeys);
    return () => {
      document.removeEventListener("contextmenu", disableContext);
      window.removeEventListener("keydown", blockKeys);
    };
  }, [registered, submitted]);

  /* =========================================================
  🎯 SELECT OPTION
  ========================================================= */
  const selectOption = (qIdx, optionIdx) => {
    const updated = [...answers];
    updated[qIdx] = optionIdx;
    setAnswers(updated);
  };

  /* =========================================================
  🧱 UI
  ========================================================= */
  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading quizzes...</div>;

  if (availableQuizzes.length > 1 && !activeQuiz)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6">
        <h2 className="text-3xl font-bold text-teal-600">Choose a Quiz</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
          {availableQuizzes.map((q) => (
            <button
              key={q._id}
              onClick={() => {
                console.log("🎯 Selected quiz:", q.title);
                setActiveQuiz(q);
                setAnswers(new Array(q.questions.length).fill(null));
              }}
              className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg border-l-4 border-teal-500 hover:-translate-y-1 transition-all duration-300"
            >
              <h3 className="font-semibold text-lg text-teal-600 dark:text-teal-400">
                {q.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 line-clamp-2">
                {q.description || "No description available"}
              </p>
            </button>
          ))}
        </div>
      </div>
    );

  if (!activeQuiz)
    return <div className="min-h-screen flex items-center justify-center text-gray-500">No active quiz available.</div>;

  if (submitted && result)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="bg-white/80 dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full animate-fade-in">
          <h2 className="text-3xl font-bold text-teal-600 mb-3">Your Result 🎯</h2>
          <p className="text-gray-700 dark:text-gray-200">Score: {result.score} / {result.totalQuestions}</p>
          <p className="text-gray-700 dark:text-gray-200">Coins Earned: {result.earnedCoins}</p>
          <p className="text-sm text-gray-500 mt-3">New balance: {result.newBalance ?? "—"} 🪙</p>
        </div>
      </div>
    );

  if (!registered)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <h2 className="text-3xl font-bold text-teal-600 mb-3">{activeQuiz.title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">{activeQuiz.description}</p>
        <button
          onClick={startQuiz}
          className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1"
        >
          Click to Start Quiz in Fullscreen
        </button>
      </div>
    );

  const question = activeQuiz.questions[index];
  const progress = ((index + 1) / activeQuiz.questions.length) * 100;
  const timerProgress = (timeLeft / 30) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 bg-gradient-to-br from-gray-100 to-teal-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
      {toast && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 ${
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

      <div className="w-full max-w-3xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400">{activeQuiz.title}</h2>
          <div className={`font-semibold ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-gray-700 dark:text-gray-200"}`}>
            ⏱️ {timeLeft}s
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-teal-500 to-green-400 transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1 mb-6 overflow-hidden">
          <div className="h-1 bg-red-500 transition-all duration-1000" style={{ width: `${timerProgress}%` }}></div>
        </div>

        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">{question.question}</h3>

        <div className="space-y-3">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => selectOption(index, i)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-300 ${
                answers[index] === i
                  ? "bg-teal-600 text-white border-teal-600 shadow-lg"
                  : "bg-white dark:bg-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={() => {
              if (index === activeQuiz.questions.length - 1) handleSubmit();
              else {
                setIndex((i) => i + 1);
                setTimeLeft(30);
              }
            }}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            {index === activeQuiz.questions.length - 1 ? "Submit" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
