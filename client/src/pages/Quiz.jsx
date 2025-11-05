import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Quiz() {
  const { user, token } = useAuth();
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [regMsg, setRegMsg] = useState("");
  const [answers, setAnswers] = useState([]);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch active quiz
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/quiz/active");
        setActiveQuiz(res.data);
        setAnswers(new Array(res.data.questions.length).fill(null));

        if (res.data.participants && user) {
          const isReg = res.data.participants.some(
            (id) => String(id) === String(user._id)
          );
          setRegistered(isReg);
        }
      } catch (err) {
        setActiveQuiz(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleRegister = async () => {
    if (!token) {
      setRegMsg("Please login to register.");
      return;
    }
    try {
      await api.post(
        `/quiz/register/${activeQuiz._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRegistered(true);
      setRegMsg("✅ Registered successfully! You can now start the quiz.");
    } catch (err) {
      setRegMsg(err.response?.data?.message || "Registration failed");
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!activeQuiz || submitted || !registered) return;
    if (timeLeft <= 0) {
      if (index < activeQuiz.questions.length - 1) {
        setIndex((i) => i + 1);
        setTimeLeft(30);
      } else {
        handleSubmit();
      }
      return;
    }
    const t = setInterval(() => setTimeLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, index, submitted, activeQuiz, registered]);

  const selectOption = (qIdx, optionIdx) => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const next = () => {
    if (index < activeQuiz.questions.length - 1) {
      setIndex((i) => i + 1);
      setTimeLeft(30);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await api.post(
        `/quiz/submit/${activeQuiz._id}`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting quiz");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading quiz...
      </div>
    );

  if (!activeQuiz)
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-600 dark:text-gray-400">
        No active quiz right now. Please check back later.
      </div>
    );

  // Not registered state
  if (!registered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center animate-fade-in">
        <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-3">
          {activeQuiz.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-xl mb-6">
          {activeQuiz.description}
        </p>
        <p className="mb-4 text-gray-500 dark:text-gray-400">
          Registration required to participate.
        </p>
        <button
          onClick={handleRegister}
          className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow transition"
        >
          Register Now
        </button>
        {regMsg && (
          <p className="mt-4 font-medium text-teal-600 dark:text-teal-400">
            {regMsg}
          </p>
        )}
      </div>
    );
  }

  // Result view
  if (submitted && result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 animate-pop">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-3">
            Quiz Completed 🎉
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Score: <span className="font-semibold">{result.score}</span> /{" "}
            {result.totalQuestions}
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Coins Earned:{" "}
            <span className="font-semibold text-yellow-500">
              {result.earnedCoins}
            </span>
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            New Balance:{" "}
            <span className="font-semibold text-teal-500">
              {result.newBalance}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Active quiz view
  const question = activeQuiz.questions[index];
  const progress = ((index + 1) / activeQuiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6 animate-fade-in">
      <div className="max-w-3xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-8 rounded-2xl shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400">
            {activeQuiz.title}
          </h2>
          <div className="text-gray-700 dark:text-gray-300 font-medium">
            ⏱️ {timeLeft}s
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="bg-teal-500 h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Question */}
        <div className="animate-slide-up">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Question {index + 1} of {activeQuiz.questions.length}
          </p>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {question.question}
          </h3>

          <div className="space-y-3">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectOption(index, i)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                  answers[index] === i
                    ? "bg-teal-500 text-white border-teal-500"
                    : "bg-white/70 dark:bg-gray-700/50 hover:bg-teal-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-end mt-6">
          <button
            onClick={next}
            className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg shadow transition"
          >
            {index === activeQuiz.questions.length - 1 ? "Submit" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
