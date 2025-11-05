import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-hidden">
      {/* 🌟 Hero Section */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center text-center px-6 relative">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-100/40 via-white to-transparent dark:from-teal-900/10 dark:via-gray-900 dark:to-gray-950"></div>

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Welcome to{" "}
            <span className="text-teal-600 dark:text-teal-400 drop-shadow-md">
              YouLearnHub
            </span>{" "}
            🎓
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            An engaging <strong>E-learning</strong> and <strong>Quiz</strong> platform
            designed for our YouTube community — test your skills every Saturday,
            earn coins, and unlock exclusive study materials.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/quiz"
              className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:bg-teal-700 transform hover:scale-105 transition-all duration-300"
            >
              Take This Week’s Quiz
            </Link>
            <Link
              to="/learn"
              className="px-8 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 shadow-md transform hover:scale-105 transition-all duration-300"
            >
              Explore Learning
            </Link>
          </div>
        </div>

        {/* Decorative blur orb */}
        <div className="absolute w-72 h-72 bg-teal-300/30 dark:bg-teal-700/20 rounded-full blur-3xl bottom-0 left-0"></div>
      </section>

      {/* 💡 Features Section */}
      <section className="py-20 bg-white dark:bg-gray-950 text-center relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600"></div>

        <h2 className="text-3xl sm:text-4xl font-bold mb-12">
          Why You’ll Love{" "}
          <span className="text-teal-600 dark:text-teal-400">YouLearnHub</span> 💡
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
          {[
            {
              icon: "🧠",
              title: "Weekly Quizzes",
              desc: "Challenge yourself every week and track your progress.",
            },
            {
              icon: "💰",
              title: "Earn Digital Coins",
              desc: "Get rewarded for your knowledge — redeem coins for notes & resources.",
            },
            {
              icon: "📚",
              title: "Learning Resources",
              desc: "Access premium notes, PDFs, and exclusive tutorials anytime.",
            },
            {
              icon: "🏆",
              title: "Leaderboard",
              desc: "Compete with others and climb the leaderboard of top learners.",
            },
            {
              icon: "📢",
              title: "Announcements",
              desc: "Stay updated with latest quizzes, winners, and events.",
            },
            {
              icon: "🎥",
              title: "YouTube Integration",
              desc: "Direct access to tutorials and content from our YouTube channel.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-teal-600 dark:text-teal-400">
                {f.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 🚀 CTA Section */}
      <section className="py-16 text-center bg-gradient-to-r from-teal-600 to-teal-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-teal-300 to-transparent"></div>
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Join the Learning Revolution 🚀
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto text-teal-100">
            Create your free account today and unlock the next generation of interactive learning.
          </p>
          <Link
            to="/register"
            className="px-10 py-3 bg-white text-teal-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
