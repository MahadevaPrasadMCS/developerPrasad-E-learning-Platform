import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { Play, Star, Zap, Lock, ArrowRight } from "lucide-react";

function Explore() {
  const [announcements, setAnnouncements] = useState([]);
  const [tutorials, setTutorials] = useState([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  // Fetch public previews (can be replaced with real API endpoints)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ann, tut, quiz] = await Promise.all([
          api.get("/announcements/public"),
          api.get("/tutorials/public"),
          api.get("/quiz/upcoming"),
        ]);
        setAnnouncements(ann.data || []);
        setTutorials(tut.data || []);
        setUpcomingQuizzes(quiz.data || []);
      } catch (err) {
        console.warn("Fallback to mock data for Explore page.");
        // Mock fallback data if APIs not public yet
        setAnnouncements([
          { _id: 1, title: "New React Quiz Coming Soon!", date: "Nov 10, 2025" },
          { _id: 2, title: "Top Learners of the Month Announced 🎉", date: "Nov 5, 2025" },
        ]);
        setTutorials([
          {
            _id: 1,
            title: "Intro to JavaScript",
            thumbnail: "https://media.geeksforgeeks.org/wp-content/uploads/20240701150350/JavaScript-Tutorial-copy.webp",
            desc: "Understand JS fundamentals with short examples.",
          },
          {
            _id: 2,
            title: "Learn React Basics",
            thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcl0L3S78sIMLZuHL3fz7_Evl1IrI3H3YXcg&s",
            desc: "Start building components and apps with React.",
          },
        ]);
        setUpcomingQuizzes([
          { _id: 1, title: "React Advanced Quiz", date: "Nov 12, 2025" },
          { _id: 2, title: "Python Basics Challenge", date: "Nov 15, 2025" },
        ]);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors duration-300 py-10 px-6">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-teal-600 dark:text-teal-400 mb-4">
          Explore. Learn. Get Inspired 🚀
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Preview tutorials, see what’s coming, and join the fastest-growing learning community.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate("/register")}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-lg transition"
          >
            Join for Free
          </button>
        </div>
      </section>

      {/* Tutorials Preview */}
      <section className="max-w-6xl mx-auto mb-16 animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            🎥 Popular Tutorials
          </h2>
          <button
            onClick={() => navigate("/login")}
            className="text-teal-500 hover:text-teal-600 font-medium flex items-center gap-1"
          >
            View All <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((t) => (
            <div
              key={t._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <img src={t.thumbnail} alt={t.title} className="w-full h-44 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
                  {t.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{t.desc}</p>
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => navigate("/login")}
                    className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                  >
                    <Play size={14} /> Watch Preview
                  </button>
                  <span className="text-gray-400 text-xs">🔒 Members Only</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Announcements Snapshot */}
      <section className="max-w-6xl mx-auto mb-16 animate-fade-up">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          📢 Latest Announcements
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((a) => (
            <div
              key={a._id}
              className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md border-l-4 border-teal-500 hover:shadow-xl transition-all duration-300"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{a.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{a.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Quizzes */}
      <section className="max-w-6xl mx-auto mb-16 animate-fade-up">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          🧩 Upcoming Quizzes
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingQuizzes.map((q) => (
            <div
              key={q._id}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {q.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Starts on {q.date}
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-3 flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
              >
                <Lock size={14} /> Login to Attempt
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Why Join Section */}
      <section className="max-w-5xl mx-auto text-center py-12 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-700 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-4">Why Join YouLearnHub?</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="flex flex-col items-center">
            <Star size={30} className="mb-2" />
            <p>Earn Coins as You Learn</p>
          </div>
          <div className="flex flex-col items-center">
            <Zap size={30} className="mb-2" />
            <p>Attempt Quizzes and Win Rewards</p>
          </div>
          <div className="flex flex-col items-center">
            <Play size={30} className="mb-2" />
            <p>Access Tutorials Anytime</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/register")}
          className="mt-6 bg-white text-teal-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100"
        >
          Get Started Now
        </button>
      </section>
    </div>
  );
}

export default Explore;
