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

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/quiz/active");
        const quiz = res.data;
        setActiveQuiz(quiz);

        if (quiz && quiz.questions)
          setAnswers(new Array(quiz.questions.length).fill(null));

        if (user && token) {
          const attemptRes = await api.get("/quiz/attempts/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const attempt = attemptRes.data.find(
            (a) => String(a.quiz._id) === String(quiz._id)
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
            const isReg =
              quiz.participants?.some((id) => String(id) === String(user._id)) ||
              false;
            setRegistered(isReg);
          }
        }
      } catch {
        setActiveQuiz(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, token]);

  const handleRegister = async () => {
    if (!token) return alert("Login to register.");
    await api.post(`/quiz/register/${activeQuiz._id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRegistered(true);
  };

  const selectOption = (qIdx, optionIdx) => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const next = () => {
    if (index < activeQuiz.questions.length - 1) {
      setIndex((i) => i + 1);
      setTimeLeft(30);
    } else handleSubmit();
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
        <div className="bg-white/80 rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold text-teal-600 mb-3">
            Your Result 🎯
          </h2>
          <p>
            Score: {result.score} / {result.totalQuestions}
          </p>
          <p>Coins Earned: {result.earnedCoins}</p>
        </div>
      </div>
    );

  if (!registered)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-3xl font-bold text-teal-600 mb-3">
          {activeQuiz.title}
        </h2>
        <p className="text-gray-600 mb-6">{activeQuiz.description}</p>
        <button
          onClick={handleRegister}
          className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow"
        >
          Register Now
        </button>
      </div>
    );

  const question = activeQuiz.questions[index];
  const progress = ((index + 1) / activeQuiz.questions.length) * 100;

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold text-teal-600">
            {activeQuiz.title}
          </h2>
          <div className="font-medium text-gray-700">⏱️ {timeLeft}s</div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-teal-500 h-2"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-gray-500 mb-2">
          Question {index + 1} of {activeQuiz.questions.length}
        </p>
        <h3 className="text-lg font-semibold mb-4">{question.question}</h3>

        <div className="space-y-3">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => selectOption(index, i)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                answers[index] === i
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-white hover:bg-teal-50 border-gray-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={next}
            className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow"
          >
            {index === activeQuiz.questions.length - 1 ? "Submit" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
