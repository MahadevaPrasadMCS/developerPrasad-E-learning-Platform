import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, PlayCircle, ShieldAlert, Info } from "lucide-react";

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
  const [violations, setViolations] = useState(0);
  const [invalidated, setInvalidated] = useState(false);

  const timerRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "info", // "info" | "success" | "warning" | "error"
  });

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  /* ===========================
     Premium Exam-Style Toasts
  ============================ */

  const showToast = useCallback((message, type = "info") => {
    console.log(`[${type.toUpperCase()}] ${message}`);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ open: true, message, type });

    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const renderToast = () => {
    if (!toast.open) return null;

    let bgClass = "bg-slate-800 text-white border border-slate-600";
    if (toast.type === "success") bgClass = "bg-emerald-600 text-white";
    if (toast.type === "warning") bgClass = "bg-amber-500 text-black";
    if (toast.type === "error") bgClass = "bg-red-600 text-white";

    const Icon =
      toast.type === "error"
        ? ShieldAlert
        : toast.type === "warning"
        ? ShieldAlert
        : toast.type === "success"
        ? CheckCircle2
        : Info;

    return (
      <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center px-4">
        <div
          className={`max-w-md w-full rounded-2xl shadow-xl px-4 py-3 sm:px-5 sm:py-3.5 flex gap-3 items-start ${bgClass}`}
        >
          <Icon className="mt-0.5 shrink-0" size={18} />
          <div className="text-sm sm:text-base leading-snug">
            {toast.message}
          </div>
        </div>
      </div>
    );
  };

  /* ===========================
     Fullscreen Helpers
  ============================ */

  const requestFullscreenSafe = async () => {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    } catch (err) {
      console.warn("Fullscreen not supported or blocked:", err);
      showToast("Fullscreen not supported on this device.", "warning");
    }
  };

  const exitFullscreenSafe = async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen)
        await document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen)
        await document.mozCancelFullScreen();
      else if (document.msExitFullscreen)
        await document.msExitFullscreen();
    } catch (err) {
      console.warn("Failed to exit fullscreen:", err);
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

  /* ===========================
     Backend: Invalidate After 3 Strikes
  ============================ */

  const handleInvalidate = useCallback(
    async (reason = "security-violation", count = 3) => {
      if (!activeQuiz || invalidated) return;

      try {
        await api.post(
          `/quiz/invalidate/${activeQuiz._id}`,
          { reason, violations: count },
          { headers: authHeader }
        );
      } catch (err) {
        console.error("Invalidate error:", err);
      }

      setInvalidated(true);
      setSubmitted(true);
      setFullscreenWarning(false);
      clearInterval(timerRef.current);
      sessionStorage.removeItem(QUIZ_STATE_KEY);

      await exitFullscreenSafe();
      showToast(
        "Your attempt has been invalidated. Contact admin.",
        "error"
      );
    },
    [activeQuiz, authHeader, invalidated, showToast]
  );

  /* ===========================
     Submit Quiz (Normal Completion)
  ============================ */

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!activeQuiz || submitted || invalidated) return;

      setSubmitted(true);
      setAutoSubmitted(auto);

      try {
        const res = await api.post(
          `/quiz/submit/${activeQuiz._id}`,
          {
            answers,
            violations, // backend can store this if implemented
          },
          { headers: authHeader }
        );

        setResult(res.data);
        await exitFullscreenSafe();
        showToast(
          auto
            ? "Quiz auto-submitted."
            : "Quiz submitted successfully.",
          "success"
        );
      } catch (err) {
        console.error("Submit error:", err);
        showToast("Submission failed. Try again.", "error");
      } finally {
        clearInterval(timerRef.current);
        sessionStorage.removeItem(QUIZ_STATE_KEY);
      }
    },
    [
      activeQuiz,
      answers,
      authHeader,
      submitted,
      invalidated,
      violations,
      showToast,
    ]
  );

  /* ===========================
     Register a Security Violation
  ============================ */

  const registerViolation = useCallback(
    (reason) => {
      if (!registered || submitted || invalidated) return;

      const next = violations + 1;
      setViolations(next);
      console.warn(`Security violation (${reason}) – strike ${next}/3`);

      if (next >= 3) {
        // 3rd strike → invalidate attempt
        handleInvalidate(reason, next);
      } else {
        // Show overlay + auto-restore fullscreen
        setFullscreenWarning(true);
        requestFullscreenSafe();
        showToast(
          `Security warning ${next}/3. Further violations will invalidate your attempt.`,
          "warning"
        );
        setTimeout(() => setFullscreenWarning(false), 2000);
      }
    },
    [
      registered,
      submitted,
      invalidated,
      violations,
      handleInvalidate,
      showToast,
    ]
  );

  /* ===========================
     Fetch Quiz List / Status
  ============================ */

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/quiz/status/me", { headers: authHeader });
        setQuizStatus(res.data || []);
      } catch (err) {
        console.error("Failed to fetch quiz status:", err);
        showToast("Failed to load quizzes. Please try again later.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, authHeader, showToast]);

  /* ===========================
     Restore Quiz From sessionStorage
  ============================ */

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
          setViolations(parsed.violations || 0);

          if (
            Array.isArray(parsed.answers) &&
            parsed.answers.length === data.questions.length
          ) {
            setAnswers(parsed.answers);
          } else {
            setAnswers(new Array(data.questions.length).fill(null));
          }

          setTimeout(() => {
            requestFullscreenSafe();
            showToast("Quiz session restored in secure mode.", "info");
          }, 200);
        } catch (err) {
          console.error("Failed to restore active quiz:", err);
          sessionStorage.removeItem(QUIZ_STATE_KEY);
        }
      })();
    } catch (err) {
      console.error("Invalid quiz state in storage:", err);
      sessionStorage.removeItem(QUIZ_STATE_KEY);
    }
  }, [token, authHeader, showToast]);

  /* ===========================
     Persist Quiz State (for refresh)
  ============================ */

  useEffect(() => {
    if (!registered || !activeQuiz || submitted || invalidated) {
      sessionStorage.removeItem(QUIZ_STATE_KEY);
      return;
    }

    const state = {
      quizId: activeQuiz._id,
      index,
      timeLeft,
      answers,
      violations,
    };
    sessionStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(state));
  }, [
    registered,
    activeQuiz,
    index,
    timeLeft,
    answers,
    violations,
    submitted,
    invalidated,
  ]);

  /* ===========================
     Security: Copy / Context / Scroll
  ============================ */

  useEffect(() => {
    if (!registered || submitted || invalidated) return;

    const prevent = (e) => e.preventDefault();
    const disableKeys = (e) => {
      const key = e.key.toUpperCase();
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(key)) ||
        key === "PRINTSCREEN"
      ) {
        e.preventDefault();
        registerViolation("devtools-or-screenshot");
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
  }, [registered, submitted, invalidated, registerViolation]);

  /* ===========================
     Fullscreen Change Watcher
  ============================ */

  useEffect(() => {
    if (!registered || submitted || invalidated) return;

    const handleFsChange = () => {
      if (!isInFullscreen()) {
        registerViolation("fullscreen-exit");
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("mozfullscreenchange", handleFsChange);
    document.addEventListener("MSFullscreenChange", handleFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange", handleFsChange);
      document.removeEventListener("MSFullscreenChange", handleFsChange);
    };
  }, [registered, submitted, invalidated, registerViolation]);

  /* ===========================
     Tab Switch / Blur Anti-Cheat
  ============================ */

  useEffect(() => {
    if (!registered || submitted || invalidated) return;

    const visHandler = () => {
      if (document.hidden) registerViolation("tab-switch-or-minimize");
    };
    const blurHandler = () => registerViolation("window-blur");

    document.addEventListener("visibilitychange", visHandler);
    window.addEventListener("blur", blurHandler);

    return () => {
      document.removeEventListener("visibilitychange", visHandler);
      window.removeEventListener("blur", blurHandler);
    };
  }, [registered, submitted, invalidated, registerViolation]);

  /* ===========================
     Timer: Single Interval
  ============================ */

  useEffect(() => {
    if (!registered || submitted || invalidated) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [registered, submitted, invalidated]);

  useEffect(() => {
    if (!registered || submitted || invalidated || !activeQuiz) return;

    if (timeLeft <= 0) {
      if (index < activeQuiz.questions.length - 1) {
        setIndex((i) => i + 1);
        setTimeLeft(30);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        handleSubmit();
      }
    }
  }, [
    timeLeft,
    registered,
    submitted,
    invalidated,
    index,
    activeQuiz,
    handleSubmit,
  ]);

  /* ===========================
     Start Quiz
  ============================ */

  const handleStartQuiz = async (quizId) => {
    try {
      // 1. Get sanitized quiz (no correct answers)
      const { data: fullQuiz } = await api.get(`/quiz/attend/${quizId}`, {
        headers: authHeader,
      });

      if (!fullQuiz.questions?.length) {
        showToast(
          "This quiz has no questions yet. Please contact admin.",
          "warning"
        );
        return;
      }

      // 2. Register user for quiz (backend may use this for tracking)
      await api.post(`/quiz/register/${quizId}`, {}, { headers: authHeader });

      showToast("Registered successfully!", "success");

      setActiveQuiz(fullQuiz);
      setAnswers(new Array(fullQuiz.questions.length).fill(null));
      setIndex(0);
      setTimeLeft(30);
      setViolations(0);
      setInvalidated(false);
      setSubmitted(false);

      await requestFullscreenSafe();
      setRegistered(true);
      showToast("Quiz started in secure fullscreen mode.", "success");
    } catch (error) {
      console.error("Start quiz error:", error);
      showToast("Unable to start the quiz. Try again later.", "error");
    }
  };

  /* ===========================
     UI States
  ============================ */

  if (loading && !activeQuiz && !result && !invalidated)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300 text-base sm:text-lg">
        {renderToast()}
        Loading quizzes...
      </div>
    );

  if (!activeQuiz && !result && !invalidated)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-teal-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {renderToast()}
        <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-8 text-center">
          Choose a Quiz
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
          {quizStatus.map((q) => (
            <div
              key={q._id}
              className={`p-5 sm:p-6 rounded-2xl shadow-md border transition-all duration-300 hover:shadow-2xl ${
                q.attempted
                  ? "bg-gray-900 border-emerald-500"
                  : "bg-gray-800 border-teal-500 hover:border-teal-400"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                  <PlayCircle className="text-teal-400" size={20} />
                  {q.title}
                </h3>
              </div>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed line-clamp-3">
                {q.description || "No description available."}
              </p>

              {q.attempted ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs sm:text-sm text-gray-200">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 size={16} />
                    <span>Submitted</span>
                  </div>
                  {typeof q.score === "number" && typeof q.totalQuestions === "number" && (
                    <span className="font-medium">
                      Score: {q.score}/{q.totalQuestions}
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleStartQuiz(q._id)}
                  className="w-full mt-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg"
                >
                  Start Quiz
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );

  if (invalidated)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-gradient-to-br from-red-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {renderToast()}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full border border-red-300/60 dark:border-red-500/40">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">
            Attempt Invalidated
          </h2>
          <p className="text-gray-700 dark:text-gray-200 text-base">
            Your attempt has been invalidated due to multiple security
            violations.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">
            Please contact the administrator for further assistance.
          </p>
        </div>
      </div>
    );

  if (result)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-gradient-to-br from-teal-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {renderToast()}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full border border-teal-200/70 dark:border-teal-500/40">
          <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-3">
            Your Result 🎯
          </h2>
          <p className="text-gray-700 dark:text-gray-200 text-base">
            Correct: {result.score}/{result.totalQuestions}
          </p>
          <p className="text-gray-700 dark:text-gray-200 text-base">
            Accuracy:{" "}
            {result.accuracy ??
              (
                (result.score / result.totalQuestions) *
                100
              ).toFixed(2)}
            %
          </p>
          <p className="text-gray-700 dark:text-gray-200 text-base">
            Coins Earned: 🪙 {result.earnedCoins}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            New Balance: {result.newBalance ?? "—"}
          </p>
        </div>
      </div>
    );

  if (!activeQuiz?.questions || activeQuiz.questions.length === 0)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 dark:text-gray-300">
        {renderToast()}
        Quiz data unavailable. Please try again later.
      </div>
    );

  // Main quiz UI
  const q = activeQuiz.questions[index];
  const progress = ((index + 1) / activeQuiz.questions.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 relative">
      {renderToast()}

      {fullscreenWarning && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center px-6 z-40">
          <h2 className="text-lg sm:text-2xl mb-2 flex items-center gap-2 justify-center">
            <ShieldAlert size={22} className="text-amber-400" />
            Security Warning
          </h2>
          <p className="text-sm sm:text-base mb-1">
            Suspicious activity detected (fullscreen / focus lost).
          </p>
          <p className="text-xs sm:text-sm opacity-80">
            Warning {violations}/3. Further violations will invalidate your
            attempt.
          </p>
        </div>
      )}

      <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 sm:p-8 border border-gray-200/70 dark:border-gray-700/60">
        <div className="flex justify-between items-center mb-3 sm:mb-5">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-teal-600 dark:text-teal-400">
              {activeQuiz.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Security strikes: {violations}/3
            </p>
          </div>
          <p className="font-semibold text-sm sm:text-base text-red-500">
            ⏱ {timeLeft}s
          </p>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mb-4 overflow-hidden">
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
              className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-all text-sm sm:text-base ${
                answers[index] === i
                  ? "bg-teal-600 text-white border-teal-600 shadow-md"
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
              if (index === activeQuiz.questions.length - 1) {
                handleSubmit();
              } else {
                setIndex((i) => i + 1);
                setTimeLeft(30);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            disabled={answers[index] === null}
            className={`px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl font-medium text-sm sm:text-base ${
              answers[index] === null
                ? "bg-gray-400/80 cursor-not-allowed text-white"
                : "bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg"
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
