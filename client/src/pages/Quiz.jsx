import React, { useEffect, useState } from "react";
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
  const [focusLost, setFocusLost] = useState(false);

  // 🧠 Fetch active quiz
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/quiz/active");
        const quiz = res.data;
        if (ignore || !quiz) return;

        setActiveQuiz(quiz);
        if (quiz?.questions?.length)
          setAnswers(new Array(quiz.questions.length).fill(null));
      } catch (err) {
        console.warn("⚠️ No active quiz:", err.response?.data?.message);
        setActiveQuiz(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => (ignore = true);
  }, []);

  // 🧩 Registration / Attempts
  useEffect(() => {
    if (!activeQuiz || !user || !token) return;
    (async () => {
      try {
        const res = await api.get("/quiz/attempts/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const attempt = res.data.find(
          (a) => a.quiz && String(a.quiz._id) === String(activeQuiz._id)
        );
        if (attempt) {
          setResult({
            score: attempt.score,
            totalQuestions: attempt.answers.length,
            earnedCoins: attempt.earnedCoins,
          });
          setSubmitted(true);
          setRegistered(true);
        } else {
          setRegistered(
            activeQuiz.participants?.some(
              (id) => String(id) === String(user._id)
            )
          );
        }
      } catch (err) {
        console.error("Attempt check error:", err.message);
      }
    })();
  }, [activeQuiz, user, token]);

  // ⏱️ Countdown Timer
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

  // 🔒 Enforce Fullscreen + Focus Lock
  useEffect(() => {
    if (registered && !submitted) {
      const enterFullscreen = async () => {
        try {
          await document.documentElement.requestFullscreen();
        } catch (err) {
          console.error("Fullscreen error:", err);
        }
      };
      enterFullscreen();

      const handleVisibility = () => {
        if (document.hidden) {
          setFocusLost(true);
          handleSubmit(true); // auto-submit
        }
      };

      const handleFullscreenExit = () => {
        if (!document.fullscreenElement && !submitted) {
          alert("You exited fullscreen. Quiz will be submitted automatically.");
          handleSubmit(true);
        }
      };

      document.addEventListener("visibilitychange", handleVisibility);
      document.addEventListener("fullscreenchange", handleFullscreenExit);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibility);
        document.removeEventListener("fullscreenchange", handleFullscreenExit);
      };
    }
  }, [registered, submitted]);

  // 🧾 Register
  const handleRegister = async () => {
    if (!token) return alert("Login to register first.");
    try {
      await api.post(
        `/quiz/register/${activeQuiz._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRegistered(true);
      alert("Registered successfully! Your quiz will start in fullscreen.");
    } catch (err) {
      alert(err.response?.data?.message || "Error registering for quiz.");
    }
  };

  // 🎯 Select option
  const selectOption = (qIdx, optionIdx) => {
    const updated = [...answers];
    updated[qIdx] = optionIdx;
    setAnswers(updated);
  };

  // ⏭️ Next Question
  const next = () => {
    if (index < activeQuiz.questions.length - 1) {
      setIndex((i) => i + 1);
      setTimeLeft(30);
    } else handleSubmit();
  };

  // 🧾 Submit
  const handleSubmit = async (auto = false) => {
    try {
      const res = await api.post(
        `/quiz/submit/${activeQuiz._id}`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
      setSubmitted(true);
      if (auto) alert("Quiz auto-submitted due to tab switch or exit.");
      if (document.fullscreenElement) document.exitFullscreen();
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting quiz.");
    }
  };

  // 🌀 Loading
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading quiz...
      </div>
    );

  // ❌ No active quiz
  if (!activeQuiz)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        No active quiz right now.
      </div>
    );

  // ✅ After submission
  if (submitted && result)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="bg-white/80 dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full animate-fade-in">
          <h2 className="text-3xl font-bold text-teal-600 mb-3">
            Your Result 🎯
          </h2>
          <p className="text-gray-700 dark:text-gray-200">
            Score: {result.score} / {result.totalQuestions}
          </p>
          <p className="text-gray-700 dark:text-gray-200">
            Coins Earned: {result.earnedCoins}
          </p>
          <p className="text-sm text-gray-500 mt-3">
            Your new balance: {result.newBalance} 🪙
          </p>
        </div>
      </div>
    );

  // 📝 Register Screen
  if (!registered)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <h2 className="text-3xl font-bold text-teal-600 mb-3">
          {activeQuiz.title}
        </h2>
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

  // 🧩 Question Layout
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

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-teal-500 to-green-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Timer Bar */}
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
