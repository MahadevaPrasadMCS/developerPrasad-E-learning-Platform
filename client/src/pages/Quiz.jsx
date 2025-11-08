import React, { useEffect, useState, useCallback } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Quiz() {
  const { user, token } = useAuth();

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  // Helpers for local submission tracking
  const isLocallySubmitted = (quizId) => !!localStorage.getItem(`submittedQuiz_${quizId}`);
  const markLocallySubmitted = (quizId) => localStorage.setItem(`submittedQuiz_${quizId}`, "1");

  // Fetch active quiz and user attempts
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/quiz/active");
        const activeQuizzes = Array.isArray(res.data) ? res.data : [res.data];
        let chosenQuiz = null;

        if (user && token) {
          try {
            const attRes = await api.get("/quiz/attempts/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const attempts = attRes.data || [];

            chosenQuiz = activeQuizzes.find(
              (q) => !attempts.some((a) => a.quizId && String(a.quizId._id) === String(q._id))
            ) || activeQuizzes[0];

            const attempt = attempts.find(
              (a) => a.quizId && String(a.quizId._id) === String(chosenQuiz._id)
            );
            if (attempt) {
              setResult({
                score: attempt.score,
                totalQuestions: attempt.answers?.length || chosenQuiz.questions.length,
                earnedCoins: attempt.earnedCoins || 0,
              });
              setSubmitted(true);
              setRegistered(true);
            } else {
              if (isLocallySubmitted(chosenQuiz._id)) setSubmitted(true);
              setRegistered(chosenQuiz.participants?.includes(user._id));
            }
          } catch (err) {
            console.warn("Attempt fetch failed:", err);
            chosenQuiz = activeQuizzes[0];
          }
        } else {
          chosenQuiz = activeQuizzes[0];
        }

        if (ignore) return;
        setActiveQuiz(chosenQuiz || null);
        if (chosenQuiz?.questions?.length) {
          setAnswers(new Array(chosenQuiz.questions.length).fill(null));
          setTimeLeft(30);
        }
      } catch (err) {
        console.warn("⚠️ No active quiz:", err.message);
        setActiveQuiz(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => (ignore = true);
  }, [user, token]);

  // Reset question index and timer
  useEffect(() => {
    setIndex(0);
    if (activeQuiz && !submitted) {
      setAnswers(new Array(activeQuiz.questions.length).fill(null));
      setTimeLeft(30);
    }
  }, [activeQuiz, submitted]);

  // Countdown timer
  useEffect(() => {
    if (!registered || submitted || !activeQuiz) return;
    if (timeLeft <= 0) {
      if (index < activeQuiz.questions.length - 1) next();
      else handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, index, registered, submitted, activeQuiz]);

  // Submit quiz
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (autoSubmitted) return;
      if (!token) return alert("Login to submit quiz.");
      if (!activeQuiz) return alert("No quiz to submit.");

      try {
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
        markLocallySubmitted(activeQuiz._id);
        setAutoSubmitted(auto);
        if (auto) alert("Quiz auto-submitted due to rule violation.");
      } catch (err) {
        alert(err.response?.data?.message || "Error submitting quiz.");
      } finally {
        if (document.fullscreenElement) document.exitFullscreen();
      }
    },
    [token, activeQuiz, answers, autoSubmitted]
  );

  // Handle register
  const handleRegister = async () => {
    if (!token) return alert("Login to register first.");
    if (!activeQuiz) return alert("No active quiz available.");

    try {
      await api.post(`/quiz/register/${activeQuiz._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistered(true);
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        console.warn("Fullscreen request failed");
      }
      alert("Registered successfully! Quiz will start in fullscreen.");
    } catch (err) {
      alert(err.response?.data?.message || "Error registering for quiz.");
    }
  };

  // Focus + Fullscreen protection
  useEffect(() => {
    if (!registered || submitted || !activeQuiz) return;

    const handleVisibility = () => {
      if (document.hidden && !autoSubmitted) {
        setTimeout(() => {
          if (document.hidden && !autoSubmitted) handleSubmit(true);
        }, 3000); // Grace period
      }
    };

    const handleFullscreenExit = async () => {
      if (!document.fullscreenElement && !autoSubmitted && !submitted) {
        const reenter = window.confirm(
          "You exited fullscreen. Do you want to re-enter to continue?"
        );
        if (reenter) {
          try {
            await document.documentElement.requestFullscreen();
          } catch (err) {
            console.warn("Re-enter fullscreen failed:", err);
          }
        } else {
          setAutoSubmitted(true);
          handleSubmit(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreenExit);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreenExit);
    };
  }, [registered, submitted, activeQuiz, handleSubmit, autoSubmitted]);

  // Optional: Disable right-click & keyboard shortcuts (Exam Mode)
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

  const selectOption = (qIdx, optionIdx) => {
    const updated = [...answers];
    updated[qIdx] = optionIdx;
    setAnswers(updated);
  };

  const next = () => {
    if (index < activeQuiz.questions.length - 1) {
      setIndex((i) => i + 1);
      setTimeLeft(30);
    } else handleSubmit();
  };

  // ------------------ UI RENDER ------------------ //

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading quiz...
      </div>
    );

  if (!activeQuiz)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        No active quiz right now.
      </div>
    );

  if (submitted && result)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="bg-white/80 dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full animate-fade-in">
          <h2 className="text-3xl font-bold text-teal-600 mb-3">Your Result 🎯</h2>
          <p className="text-gray-700 dark:text-gray-200">
            Score: {result.score} / {result.totalQuestions}
          </p>
          <p className="text-gray-700 dark:text-gray-200">
            Coins Earned: {result.earnedCoins}
          </p>
          <p className="text-sm text-gray-500 mt-3">
            New balance: {result.newBalance ?? "—"} 🪙
          </p>
        </div>
      </div>
    );

  if (!registered)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <h2 className="text-3xl font-bold text-teal-600 mb-3">{activeQuiz.title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
          {activeQuiz.description}
        </p>
        <button
          onClick={handleRegister}
          className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1"
        >
          Start Quiz
        </button>
      </div>
    );

  const question = activeQuiz.questions[index];
  const progress = ((index + 1) / activeQuiz.questions.length) * 100;
  const timerProgress = (timeLeft / 30) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 bg-gradient-to-br from-gray-100 to-teal-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
      <div className="w-full max-w-3xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400">
            {activeQuiz.title}
          </h2>
          <div
            className={`font-semibold ${
              timeLeft <= 10
                ? "text-red-500 animate-pulse"
                : "text-gray-700 dark:text-gray-200"
            }`}
          >
            ⏱️ {timeLeft}s
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-teal-500 to-green-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1 mb-6 overflow-hidden">
          <div
            className="h-1 bg-red-500 transition-all duration-1000"
            style={{ width: `${timerProgress}%` }}
          ></div>
        </div>

        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">
          {question.question}
        </h3>

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
            onClick={next}
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
