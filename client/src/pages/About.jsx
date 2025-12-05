import React from "react";
import { Code, Target, Rocket } from "lucide-react";

function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 px-6">
      <title>About</title>
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-teal-600 dark:text-teal-400 mb-6">
          About YouLearnHub
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
          YouLearnHub is an e-learning platform I built to help students
          learn interactively — through tutorials, quizzes, discussions, and rewards.
          It blends education with motivation, helping learners stay consistent.
        </p>

        <div className="grid sm:grid-cols-3 gap-8 mt-12">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <Code size={40} className="text-teal-500 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Developer Journey
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
              Built with MERN Stack — React, Node.js, Express, and MongoDB.
              Every feature here represents my growth as a developer.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <Target size={40} className="text-teal-500 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              My Goal
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
              To make learning rewarding. You earn coins as you progress and
              redeem them for valuable resources — making education exciting again.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <Rocket size={40} className="text-teal-500 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              The Vision
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
              Build a student-friendly ecosystem — where learning, motivation,
              and rewards exist in harmony.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Developed with ❤️ by <span className="text-teal-500 font-semibold">Mahadeva Prasad M</span></p>
          <p className="mt-1">Computer Science & Engineering, VTU CPGS Mysuru</p>
        </div>
      </div>
      {/* About Me Card */}
      <section className="max-w-md mx-auto mt-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border border-gray-200 dark:border-gray-700 animate-fade-in">
        <img
          src="https://avatars.githubusercontent.com/u/124894847?v=4" // replace with your GitHub or personal photo
          alt="Mahadeva Prasad M"
          className="w-28 h-28 rounded-full shadow-md mb-4 border-4 border-teal-500"
        />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Mahadeva Prasad M
        </h2>
        <p className="text-teal-600 dark:text-teal-400 font-medium">
          Software Developer | Full-Stack Enthusiast
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm max-w-sm">
          Aspiring full-stack developer from Mysuru, India. Passionate about
          building secure, scalable, and interactive web apps using the MERN stack
          with a focus on performance and user experience.
        </p>

        <div className="mt-4 flex gap-4">
          <a
            href="https://github.com/MahadevaPrasadMCS"
            target="_blank"
            rel="noreferrer"
            className="text-gray-600 dark:text-gray-300 hover:text-teal-500 transition"
          >
            <i className="fab fa-github text-2xl"></i>
          </a>
          <a
            href="https://www.linkedin.com/in/mahadeva-prasad-m-a603a4388/"
            target="_blank"
            rel="noreferrer"
            className="text-gray-600 dark:text-gray-300 hover:text-teal-500 transition"
          >
            <i className="fab fa-linkedin text-2xl"></i>
          </a>
          <a
            href="mailto:mahadevaprasadcs26@gmail.com"
            className="text-gray-600 dark:text-gray-300 hover:text-teal-500 transition"
          >
            <i className="fas fa-envelope text-2xl"></i>
          </a>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">React.js</span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">Node.js</span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">TailwindCSS</span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">SQL</span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">Java</span>
        </div>
      </section>

    </div>
  );
}

export default About;
