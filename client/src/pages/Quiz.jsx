import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, PlayCircle } from "lucide-react";

const QUIZ_STATE_KEY = "youlearnhub_active_quiz";

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

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  /* 🧠 Fetch quizzes with attempt info for list view */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/quiz/status/me", {
          headers: authHeader,
        });
        setQuizStatus(res.data || []);
      } catch (err) {
        console.error("Failed to fetch quiz status:", err);
        showToast("Failed to load quizzes. Please try again later.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]); // authHeader only depends on token

  /* 🔁 Restore active quiz from sessionStorage (refresh protection) */
  useEffect(() => {
    if (!token) return;
    const saved = sessionStorage.getItem(QUIZ_STATE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (!parsed.quizId) return;

      (async () => {
        try {
          const { data } = await api.get(`/quiz/attend/${parsed.quizId}`, {
            headers: authHeader,
          });

          if (!data?.questions?.length) {
            sessionStorage.removeItem(QUIZ_STATE_KEY);
            return;
          }

          setActiveQuiz(data);
          setRegistered(true);
          setIndex(parsed.index || 0);
          setTimeLeft(parsed.timeLeft || 30);

          if (
            Array.isArray(parsed.answers) &&
            parsed.answers.length === data.questions.length
          ) {
            setAnswers(parsed.answers);
          } else {
            setAnswers(new Array(data.questions.length).fill(null));
          }

          showToast("Restored your active quiz session.", "info");
        } catch (err) {
          console.error("Failed to restore active quiz:", err);
          sessionStorage.removeItem(QUIZ_STATE_KEY);
        }
      })();
    } catch (err) {
      console.error("Invalid quiz state in storage:", err);
      sessionStorage.removeItem(QUIZ_STATE_KEY);
    }
  }, [token]);

  /* 💾 Persist quiz state while in progress */
  useEffect(() => {
    if (!registered || !activeQuiz || submitted) {
      sessionStorage.removeItem(QUIZ_STATE_KEY);
      return;
    }

    const state = {
      quizId: activeQuiz._id,
      index,
      timeLeft,
      answers,
    };
    sessionStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(state));
  }, [registered, activeQuiz, index, timeLeft, answers, submitted]);

  /* 🚫 Security Setup — disable copy/paste, context menu, selection, scroll */
  useEffect(() => {
    if (!registered || submitted) return;

    const prevent = (e) => e.preventDefault();
    const disableKeys = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          ["I", "J", "C"].includes(e.key.toUpperCase())) ||
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

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      ["contextmenu", "copy", "cut", "paste"].forEach((evt) =>
        document.removeEventListener(evt, prevent)
      );
      window.removeEventListener("keydown", disableKeys);
      document.onselectstart = null;
      document.body.style.overflow = prevOverflow;
    };
  }, [registered, submitted]);

  /* 🧩 Helper: request fullscreen with vendor prefixes */
  const requestFullscreenSafe = async () => {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      else throw new Error("Fullscreen API not supported");
    } catch (err) {
      console.warn("Fullscreen not supported or blocked:", err);
      showToast("Fullscreen not supported on this device.", "warning");
    }
  };

  const isInFullscreen = () => {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  };

  /* 🧨 Unified violation handler (fullscreen/tab switch) */
  const triggerViolationCountdown = useCallback(() => {
    if (submitted || autoSubmitted) return;
    setFullscreenWarning(true);

    if (fullscreenTimeout.current) clearTimeout(fullscreenTimeout.current);
    fullscreenTimeout.current = setTimeout(() => {
      setFullscreenWarning(false);
      handleSubmit(true);
    }, 5000);
  }, [submitted, autoSubmitted]); // handleSubmit defined below + re-bound

  /* 📝 Submit Quiz (with double-submit guard) */
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!activeQuiz || submitted) return;

      setSubmitted(true);
      setAutoSubmitted(auto);

      try {
        const res = await api.post(
          `/quiz/submit/${activeQuiz._id}`,
          { answers },
          { headers: authHeader }
        );

        let baseResult = {
          ...res.data,
          autoSubmitted: auto,
        };

        setResult(baseResult);

        // 🎯 Fetch quiz analytics (admin-protected, so ignore errors silently)
        try {
          const analyticsRes = await api.get(
            `/quiz/${activeQuiz._id}/analytics`,
            { headers: authHeader }
          );
          setResult((prev) => ({
            ...prev,
            averageScore: analyticsRes.data.averageScore?.toFixed(2),
            successRate: analyticsRes.data.successRate?.toFixed(2),
          }));
        } catch (err) {
          console.warn("Analytics fetch failed:", err.message);
        }

        if (isInFullscreen()) {
          try {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (document.webkitExitFullscreen)
              await document.webkitExitFullscreen();
          } catch (err) {
            console.warn("Failed exiting fullscreen:", err);
          }
        }
      } catch (err) {
        console.error("Submit error:", err);
        showToast("Submission failed. Try again.", "error");
      } finally {
        clearInterval(timerRef.current);
        if (fullscreenTimeout.current) clearTimeout(fullscreenTimeout.current);
        sessionStorage.removeItem(QUIZ_STATE_KEY);
      }
    },
    [activeQuiz, answers, authHeader, submitted]
  );

  /* re-bind triggerViolationCountdown now that handleSubmit exists */
  useEffect(() => {
    // no-op; just ensures hook order is valid
  }, [handleSubmit]);

  /* 🚨 Fullscreen Exit Watcher */
  useEffect(() => {
    if (!registered || submitted) return;

    const handleExit = () => {
      if (!isInFullscreen()) {
        showToast(
          "Fullscreen exited. Quiz will be auto-submitted in 5 seconds.",
          "warning"
        );
        triggerViolationCountdown();
      } else {
        if (fullscreenTimeout.current)
          clearTimeout(fullscreenTimeout.current);
        setFullscreenWarning(false);
      }
    };

    document.addEventListener("fullscreenchange", handleExit);
    document.addEventListener("webkitfullscreenchange", handleExit);
    document.addEventListener("mozfullscreenchange", handleExit);
    document.addEventListener("MSFullscreenChange", handleExit);

    return () => {
      document.removeEventListener("fullscreenchange", handleExit);
      document.removeEventListener("webkitfullscreenchange", handleExit);
      document.removeEventListener("mozfullscreenchange", handleExit);
      document.removeEventListener("MSFullscreenChange", handleExit);
    };
  }, [registered, submitted, triggerViolationCountdown]);

  /* 👀 Tab switch / window blur anti-cheat */
  useEffect(() => {
    if (!registered || submitted) return;

    const suspicious = () => {
      showToast(
        "Tab switch / window blur detected. Quiz will be auto-submitted in 5 seconds.",
        "warning"
      );
      triggerViolationCountdown();
    };

    const visHandler = () => {
      if (document.hidden) suspicious();
    };
    const blurHandler = () => suspicious();

    document.addEventListener("visibilitychange", visHandler);
    window.addEventListener("blur", blurHandler);

    return () => {
      document.removeEventListener("visibilitychange", visHandler);
      window.removeEventListener("blur", blurHandler);
    };
  }, [registered, submitted, triggerViolationCountdown]);

  /* ⏱ Timer — single stable interval */
  useEffect(() => {
    if (!registered || submitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [registered, submitted]);

  /* ⏱ React to timer reaching zero */
  useEffect(() => {
    if (!registered || submitted || !activeQuiz) return;

    if (timeLeft <= 0) {
      if (index < activeQuiz.questions.length - 1) {
        setIndex((i) => i + 1);
        setTimeLeft(30);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        handleSubmit();
      }
    }
  }, [timeLeft, registered, submitted, index, activeQuiz, handleSubmit]);

  /* ▶️ Start Quiz */
  const handleStartQuiz = async (quizId) => {
    try {
      // 1️⃣ Get sanitized quiz (no correct answers included)
      const { data: fullQuiz } = await api.get(`/quiz/attend/${quizId}`, {
        headers: authHeader,
      });

      if (!fullQuiz.questions?.length) {
        showToast(
          "⚠️ This quiz has no questions yet. Please contact admin.",
          "warning"
        );
        return;
      }

      // 2️⃣ Register the user (in case backend expects explicit registration)
      await api.post(
        `/quiz/register/${quizId}`,
        {},
        { headers: authHeader }
      );

      showToast("Registered successfully!", "success");

      setActiveQuiz(fullQuiz);
      const initialAnswers = new Array(fullQuiz.questions.length).fill(null);
      setAnswers(initialAnswers);
      setIndex(0);
      setTimeLeft(30);

      await requestFullscreenSafe();
      setRegistered(true);
      showToast("Quiz started in fullscreen mode!", "success");
    } catch (error) {
      console.error("Start quiz error:", error);
      showToast("Unable to start the quiz. Try again later.", "error");
    }
  };

  /* 🧱 Loading State */
  if (loading && !activeQuiz && !result)
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
                  Submitted —{" "}
                  <span className="ml-1">
                    Score: {q.score}/{q.totalQuestions}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => handleStartQuiz(q._id)} // ✅ fixed reference
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
          <h2 className="text-2xl font-bold text-teal-600 mb-3">
            Your Result 🎯
          </h2>
          <p className="text-gray-700 dark:text-gray-200 text-base">
            Correct: {result.score}/{result.totalQuestions}
          </p>
          <p className="text-gray-700 dark:text-gray-200 text-base">
            Accuracy:{" "}
            {result.accuracy ||
              (
                (result.score / result.totalQuestions) *
                100
              ).toFixed(2)}
            %
          </p>
          <p className="text-gray-700 dark:text-gray-200 text-base">
            Coins Earned: 🪙 {result.earnedCoins}
          </p>

          {result.averageScore && (
            <div className="mt-3 border-t border-gray-300 dark:border-gray-600 pt-2 text-sm text-gray-500 dark:text-gray-400">
              Avg Score:{" "}
              <span className="font-semibold text-teal-500">
                {result.averageScore}%
              </span>{" "}
              | Success Rate:{" "}
              <span className="font-semibold text-green-500">
                {result.successRate}%
              </span>
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
          <h2 className="text-lg sm:text-2xl mb-2">⚠️ Attention</h2>
          <p className="text-sm sm:text-base">
            Fullscreen / focus was lost. The quiz will be auto-submitted in a
            few seconds.
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
