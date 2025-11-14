import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, PlayCircle, ShieldAlert, Info } from "lucide-react";

function Quiz() {
  const { token } = useAuth();

  // Device detection
  const [isMobile, setIsMobile] = useState(false);

  // Quiz list
  const [quizStatus, setQuizStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  // Flow flags
  const [readyToStart, setReadyToStart] = useState(false); // desktop: selected quiz, waiting for F
  const [pendingQuiz, setPendingQuiz] = useState(null);    // desktop: quiz data waiting for fullscreen
  const [registered, setRegistered] = useState(false);     // quiz running
  const [submitted, setSubmitted] = useState(false);
  const [invalidated, setInvalidated] = useState(false);
  const [result, setResult] = useState(null);              // result shown once; cleared on refresh / new start

  // Security state
  const [violations, setViolations] = useState(0);
  const [fullscreenLost, setFullscreenLost] = useState(false); // desktop only
  const [countdown, setCountdown] = useState(null); // 3..2..1 before timer starts
  const [paused, setPaused] = useState(false);      // generic pause (focus lost, fullscreen lost, countdown, etc.)

  // Toast
  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "info",
  });

  const toastTimeoutRef = useRef(null);
  const timerRef = useRef(null);

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  /* ===========================
     Device Detection
  ============================ */
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
    }
  }, []);

  /* ===========================
     Toast System
  ============================ */

  const showToast = useCallback((message, type = "info") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ open: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const renderToast = () => {
    if (!toast.open) return null;

    let bgClass = "bg-slate-900 text-white border border-slate-700";
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
     Fullscreen Helpers (Desktop)
  ============================ */

  const requestFullscreenSafe = () => {
    if (isMobile) return; // mobile: no fullscreen
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } catch (err) {
      console.warn("Fullscreen not supported:", err);
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

  const isInFullscreen = () =>
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;

  /* ===========================
     Invalidate Attempt
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
      setFullscreenLost(false);
      setPaused(true);
      clearInterval(timerRef.current);
      await exitFullscreenSafe();
      showToast(
        "Your attempt has been invalidated. Please contact the administrator.",
        "error"
      );
    },
    [activeQuiz, invalidated, authHeader, showToast]
  );

  /* ===========================
     Register Security Violation
  ============================ */

  const registerViolation = useCallback(
    (reason) => {
      if (!registered || submitted || invalidated) return;

      setViolations((prev) => {
        const next = prev + 1;

        // Desktop: fullscreen exit
        if (!isMobile && reason === "fullscreen-exit") {
          setFullscreenLost(true);
          setPaused(true);
        }

        // Mobile: tab/app switch message (A)
        if (
          isMobile &&
          (reason === "tab-switch-or-minimize" || reason === "window-blur")
        ) {
          showToast(
            "Focus lost — timer paused. Return to quiz.",
            "warning"
          );
        } else if (
          !isMobile ||
          (reason !== "tab-switch-or-minimize" &&
            reason !== "window-blur")
        ) {
          showToast(
            `Security warning ${next}/3. Further violations may invalidate your attempt.`,
            "warning"
          );
        }

        if (next >= 3) {
          handleInvalidate(reason, next);
        }

        return next;
      });
    },
    [registered, submitted, invalidated, isMobile, handleInvalidate, showToast]
  );

  /* ===========================
     Submit Quiz
  ============================ */

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!activeQuiz || submitted || invalidated) return;
      setSubmitted(true);

      try {
        const res = await api.post(
          `/quiz/submit/${activeQuiz._id}`,
          { answers, violations },
          { headers: authHeader }
        );

        setResult(res.data); // show once (until refresh)
        await exitFullscreenSafe();
        showToast(
          auto ? "Quiz auto-submitted." : "Quiz submitted successfully.",
          "success"
        );
      } catch (err) {
        console.error("Submit error:", err);
        showToast("Submission failed. Try again.", "error");
      } finally {
        clearInterval(timerRef.current);
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
     Fetch Quiz List / Status
  ============================ */

  useEffect(() => {
    if (!token) return;

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
     Start Quiz (Select)
  ============================ */

  const handleStartQuiz = async (quizId, attempted) => {
    if (attempted) {
      showToast("You have already submitted this quiz.", "info");
      return;
    }

    try {
      const { data } = await api.get(`/quiz/attend/${quizId}`, {
        headers: authHeader,
      });

      if (!data?.questions?.length) {
        showToast(
          "This quiz has no questions yet. Please contact admin.",
          "warning"
        );
        return;
      }

      // Clear old result for this new attempt
      setResult(null);
      setSubmitted(false);
      setInvalidated(false);
      setViolations(0);
      setFullscreenLost(false);
      setPaused(false);
      setIndex(0);
      setTimeLeft(30);

      if (isMobile) {
        // MOBILE: Soft-strict mode (no fullscreen)
        try {
          await api.post(`/quiz/register/${data._id}`, {}, { headers: authHeader });
        } catch (err) {
          console.error("Register error:", err);
          showToast(
            err.response?.data?.message ||
              "Failed to register for quiz. Try again.",
            "error"
          );
          return;
        }
        setActiveQuiz(data);
        setAnswers(new Array(data.questions.length).fill(null));
        setRegistered(true);
        setReadyToStart(false);
        setCountdown(3);
        setPaused(true);
        showToast("Mobile secure mode enabled. Quiz starting...", "info");
      } else {
        // DESKTOP: Wait for F (fullscreen)
        setPendingQuiz(data);
        setReadyToStart(true);
        setActiveQuiz(null);
        showToast("Press F to enter secure fullscreen and begin.", "info");
      }
    } catch (error) {
      console.error("Start quiz error:", error);
      showToast("Unable to prepare the quiz. Try again later.", "error");
    }
  };

  /* ===========================
     Desktop: Press F to start / resume
  ============================ */

  useEffect(() => {
    if (isMobile) return; // no fullscreen/F on mobile

    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() !== "f") return;
      if (!token) return;

      // Start quiz first time
      if (
        readyToStart &&
        pendingQuiz &&
        !registered &&
        !submitted &&
        !invalidated
      ) {
        requestFullscreenSafe();

        setTimeout(async () => {
          if (!isInFullscreen()) {
            showToast(
              "Fullscreen is required to start the quiz. Please allow it.",
              "error"
            );
            return;
          }

          try {
            await api.post(
              `/quiz/register/${pendingQuiz._id}`,
              {},
              { headers: authHeader }
            );
          } catch (err) {
            console.error("Register error:", err);
            showToast(
              err.response?.data?.message ||
                "Failed to register for quiz. Try again.",
              "error"
            );
            return;
          }

          setActiveQuiz(pendingQuiz);
          setAnswers(new Array(pendingQuiz.questions.length).fill(null));
          setRegistered(true);
          setReadyToStart(false);
          setFullscreenLost(false);
          setCountdown(3);
          setPaused(true);

          showToast("Secure fullscreen enabled. Get ready!", "success");
        }, 200);

        return;
      }

      // Resume after fullscreen exit
      if (registered && fullscreenLost && !submitted && !invalidated) {
        requestFullscreenSafe();
        setTimeout(() => {
          if (!isInFullscreen()) {
            showToast(
              "Fullscreen still not active. Press F again and allow it.",
              "error"
            );
            return;
          }
          setFullscreenLost(false);
          setPaused(false);
          showToast("Resumed in secure fullscreen mode.", "success");
        }, 200);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isMobile,
    token,
    readyToStart,
    pendingQuiz,
    registered,
    fullscreenLost,
    submitted,
    invalidated,
    authHeader,
    showToast,
  ]);

  /* ===========================
     Countdown 3..2..1
  ============================ */

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      setTimeLeft(30);
      setPaused(false);
      return;
    }
    const id = setTimeout(
      () => setCountdown((c) => (c !== null ? c - 1 : null)),
      1000
    );
    return () => clearTimeout(id);
  }, [countdown]);

  const renderCountdownOverlay = () =>
    countdown !== null && (
      <div className="fixed inset-0 z-30 bg-black/70 flex flex-col items-center justify-center text-white text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-gray-300 mb-2">
          Starting in
        </p>
        <p className="text-6xl sm:text-7xl font-extrabold animate-pulse">
          {countdown}
        </p>
      </div>
    );

  /* ===========================
     Timer
  ============================ */

  useEffect(() => {
    if (
      !registered ||
      submitted ||
      invalidated ||
      paused ||
      countdown !== null ||
      !activeQuiz
    ) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [
    registered,
    submitted,
    invalidated,
    paused,
    countdown,
    activeQuiz,
  ]);

  useEffect(() => {
    if (
      !registered ||
      submitted ||
      invalidated ||
      !activeQuiz ||
      countdown !== null ||
      paused
    )
      return;

    if (timeLeft <= 0) {
      if (index < activeQuiz.questions.length - 1) {
        setIndex((i) => i + 1);
        setTimeLeft(30);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        handleSubmit(true);
      }
    }
  }, [
    timeLeft,
    registered,
    submitted,
    invalidated,
    activeQuiz,
    index,
    countdown,
    paused,
    handleSubmit,
  ]);

  /* ===========================
     Security: Devtools / Copy / Tab Switch
  ============================ */

  // Devtools + copy/paste
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

  // Fullscreen exit watcher (desktop)
  useEffect(() => {
    if (!registered || submitted || invalidated || isMobile) return;

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
  }, [registered, submitted, invalidated, isMobile, registerViolation]);

  // Tab switch / blur (desktop + mobile)
  useEffect(() => {
    if (!registered || submitted || invalidated) return;

    const visHandler = () => {
      if (document.hidden) {
        setPaused(true);
        registerViolation("tab-switch-or-minimize");
      }
    };

    const blurHandler = () => {
      setPaused(true);
      registerViolation("window-blur");
    };

    window.addEventListener("blur", blurHandler);
    document.addEventListener("visibilitychange", visHandler);

    return () => {
      window.removeEventListener("blur", blurHandler);
      document.removeEventListener("visibilitychange", visHandler);
    };
  }, [registered, submitted, invalidated, registerViolation]);

  /* ===========================
     UI Helpers
  ============================ */

  const renderPixelOverlay = () =>
    !isMobile && fullscreenLost && (
      <div className="fixed inset-0 z-40 bg-black/80 flex flex-col items-center justify-center text-white text-center px-6">
        <ShieldAlert size={32} className="text-amber-400 mb-3 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">Oops! You left fullscreen</h2>
        <p className="text-sm sm:text-base mb-1">
          Your exam is paused for security reasons.
        </p>
        <p className="text-xs sm:text-sm opacity-80">
          Press <span className="font-semibold">F</span> to get back and
          continue.
        </p>
      </div>
    );

  /* ===========================
     UI States
  ============================ */

  // Loading list
  if (loading && !activeQuiz && !result && !invalidated && !readyToStart)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300 text-base sm:text-lg bg-gray-50 dark:bg-gray-900">
        {renderToast()}
        Loading quizzes...
      </div>
    );

  // Quiz list view (after refresh or before attempt)
  if (!activeQuiz && !result && !invalidated && !readyToStart)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-teal-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {renderToast()}
        <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2 text-center">
          Available Quizzes
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">
          {isMobile
            ? "Mobile secure mode enabled. For stricter protection, use a laptop/desktop."
            : "Your quiz will run in secure fullscreen. Use a laptop/desktop for best experience."}
        </p>
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
                <div className="flex flex-col gap-1 text-xs sm:text-sm text-gray-200">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 size={16} />
                    <span>Submitted</span>
                  </div>
                  {typeof q.score === "number" &&
                    typeof q.totalQuestions === "number" && (
                      <span className="font-medium">
                        Score: {q.score}/{q.totalQuestions}
                      </span>
                    )}
                  {/* A: Disable Start button if submitted */}
                  <button
                    disabled
                    className="w-full mt-1 py-2.5 bg-gray-600 text-gray-300 rounded-xl font-medium text-sm cursor-not-allowed opacity-70"
                  >
                    Quiz Completed
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartQuiz(q._id, q.attempted)}
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

  // Desktop pre-start screen
  if (readyToStart && !registered && pendingQuiz && !isMobile)
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
        {renderToast()}
        <div className="max-w-md w-full bg-gray-900/80 border border-teal-500/60 rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="text-teal-400" size={22} />
            <h2 className="text-xl sm:text-2xl font-bold">
              Secure Exam Mode
            </h2>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            Your quiz <span className="font-semibold">{pendingQuiz.title}</span>{" "}
            will run in fullscreen with security monitoring.
          </p>
          <ul className="text-xs sm:text-sm text-gray-400 mb-4 list-disc list-inside space-y-1">
            <li>Do not switch tabs or minimize the window.</li>
            <li>Do not open developer tools or take screenshots.</li>
            <li>Leaving fullscreen will pause the quiz and add a strike.</li>
          </ul>
          <div className="mt-4 text-sm">
            <p className="mb-1 font-medium">
              To continue, press{" "}
              <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-600 text-xs">
                F
              </span>{" "}
              on your keyboard.
            </p>
            <p className="text-xs text-gray-500">
              After fullscreen is enabled, the quiz will start with a short
              countdown.
            </p>
          </div>
        </div>
      </div>
    );

  // Invalidated screen
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

  // Result screen (shown until user refreshes route)
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
          <p className="text-xs text-gray-400 mt-3">
            Refresh the page to return to the quiz list.
          </p>
        </div>
      </div>
    );

  if (!activeQuiz?.questions || activeQuiz.questions.length === 0)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
        {renderToast()}
        Quiz data unavailable. Please try again later.
      </div>
    );

  // Main quiz UI
  const q = activeQuiz.questions[index];
  const progress = ((index + 1) / activeQuiz.questions.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 bg-gray-50 dark:bg-gray-900 relative">
      {renderToast()}
      {renderPixelOverlay()}
      {renderCountdownOverlay()}

      <div
        className={`max-w-6xl w-full grid grid-cols-1 md:grid-cols-[240px,1fr] gap-4 sm:gap-6`}
      >
        {/* Sidebar: Question Map */}
        <aside className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200/70 dark:border-gray-700/60 p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <ShieldAlert size={16} className="text-teal-500" />
            Question Map
          </h3>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {activeQuiz.questions.map((_, i) => {
              const isCurrent = i === index;
              const answered = answers[i] !== null && answers[i] !== undefined;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setTimeLeft(30);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all 
                    ${
                      isCurrent
                        ? "bg-teal-600 text-white shadow-md"
                        : answered
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-700 dark:text-emerald-100"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-auto text-[11px] text-gray-500 dark:text-gray-400">
            <p>
              Strikes:{" "}
              <span className="font-semibold text-amber-500">
                {violations}/3
              </span>
            </p>
            {!isMobile && (
              <p className="mt-1">
                Press{" "}
                <span className="px-1 rounded bg-gray-800 text-[10px] border border-gray-600">
                  F
                </span>{" "}
                to re-enter fullscreen if paused.
              </p>
            )}
          </div>
        </aside>

        {/* Main Quiz Card */}
        <main className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-7 border border-gray-200/70 dark:border-gray-700/60">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-teal-600 dark:text-teal-400">
                {activeQuiz.title}
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                Question {index + 1} of {activeQuiz.questions.length}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm sm:text-base text-red-500">
                ⏱ {timeLeft}s
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Strikes: {violations}/3
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mb-4 overflow-hidden">
            <div
              className="h-2 bg-teal-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <h3 className="text-sm sm:text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            {q.question}
          </h3>

          <div className="space-y-2 sm:space-y-3 mb-5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const updated = [...answers];
                  updated[index] = i;
                  setAnswers(updated);
                }}
                className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-all text-sm sm:text-base ${
                  answers[index] === i
                    ? "bg-teal-600 text-white border-teal-600 shadow-md scale-[1.01]"
                    : "bg-white hover:bg-teal-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={() => {
                if (index === activeQuiz.questions.length - 1) {
                  handleSubmit(false);
                } else {
                  setIndex((i) => i + 1);
                  setTimeLeft(30);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={answers[index] === null || answers[index] === undefined}
              className={`px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl font-medium text-sm sm:text-base ${
                answers[index] === null || answers[index] === undefined
                  ? "bg-gray-400/80 cursor-not-allowed text-white"
                  : "bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg"
              }`}
            >
              {index === activeQuiz.questions.length - 1 ? "Submit" : "Next →"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Quiz;
