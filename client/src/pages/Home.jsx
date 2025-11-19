import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Typewriter from "typewriter-effect";
import ParticlesBG from "../components/ParticlesBG";

function Home() {
  const { user } = useAuth();
  const [showMobileRadar, setShowMobileRadar] = useState(false);

  const featureItems = [
    {
      title: "Skill Radar Intelligence",
      description:
        "See a live radar of your strengths and gaps across core tech skills so you always know what to work on next.",
    },
    {
      title: "Weekly Role-Based Challenges",
      description:
        "Attempt curated quizzes aligned to real roles like Frontend, Backend or Data — not random questions.",
    },
    {
      title: "Progress You Can Feel",
      description:
        "XP, coins, streaks and levels turn consistency into a game while you steadily move towards your goals.",
    },
    {
      title: "Actionable Analytics",
      description:
        "Topic-wise stats, accuracy, streak history and performance trends help you learn like a professional.",
    },
    {
      title: "Resource Unlocks",
      description:
        "Redeem coins for curated notes, sheets and resources recommended from your performance data.",
    },
    {
      title: "Student-First Community",
      description:
        "Ask doubts, discuss solutions and share resources in a focused, distraction-free learning space.",
    },
  ];

  const howSteps = [
    {
      number: "1",
      title: "Pick Your Track",
      description:
        "Choose where you want to grow — DSA, Web, Core CS or Role-based tracks like Frontend or Backend.",
    },
    {
      number: "2",
      title: "Attempt Weekly Challenges",
      description:
        "Solve quizzes, maintain streaks and earn XP while the system learns how you perform.",
    },
    {
      number: "3",
      title: "Watch Your Skill Radar Evolve",
      description:
        "See your radar expand as weak areas improve, and use it to decide what to do next every week.",
    },
  ];

  const testimonials = [
    {
      quote:
        "The Skill Radar made my strengths and weaknesses visible in one screen. It guided exactly what to study before placements.",
      name: "Akhil · Final Year CSE",
    },
    {
      quote:
        "Instead of random practice, I now focus on low-scoring radar areas. My quiz accuracy and confidence both went up.",
      name: "Sneha · Aspiring Backend Developer",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-x-hidden">

      {/* HERO */}
      <section className="relative flex justify-center w-full mx-auto px-4 sm:px-6 lg:px-12 pt-14 pb-12 sm:pt-16 sm:pb-14 lg:pt-20 lg:pb-16">
        <ParticlesBG />

        <div className="relative z-10 max-w-[1600px] w-full flex flex-col lg:flex-row items-center lg:items-center gap-14">

          {/* LEFT CONTENT */}
          <div className="flex-1 flex flex-col justify-center space-y-5 sm:space-y-6">
            <span className="inline-flex items-center text-[11px] sm:text-xs uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-3 py-1 rounded-full mx-auto lg:mx-0">
              Practice Tech · See Your Skills
            </span>

            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight">
                Make Your
                <span className="text-emerald-500"> Skill Gaps </span>
                Visible. Then Close Them.
              </h1>

              <div className="mt-3 text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 min-h-[3rem] leading-snug">
                <Typewriter
                  options={{
                    autoStart: true,
                    loop: true,
                    delay: 45,
                    deleteSpeed: 30,
                    strings: [
                      "Track your skills with a live radar, not guesswork.",
                      "Turn weekly challenges into measurable progress.",
                      "Build interview-ready confidence — one quiz at a time.",
                    ],
                  }}
                />
              </div>

              <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-xl mx-auto lg:mx-0">
                YouLearnHub combines weekly challenges, analytics and a Skill Radar so you always know
                <span className="font-semibold"> what to do next </span>
                in your learning journey.
              </p>
            </div>

            {/* PRIMARY + SECONDARY CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-3">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="w-full sm:w-auto justify-center inline-flex px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-lg transition-transform hover:scale-[1.03]"
              >
                {user ? "Open Dashboard" : "Start Free in 60 Seconds"}
              </Link>

              {!user && (
                <Link
                  to="/login"
                  className="w-full sm:w-auto justify-center inline-flex px-6 sm:px-8 py-3 text-sm sm:text-base font-medium bg-transparent dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 transition"
                >
                  Already have an account?
                </Link>
              )}
            </div>

            {/* MOBILE: RADAR TOGGLE */}
            <button
              onClick={() => setShowMobileRadar((prev) => !prev)}
              className="mt-3 inline-flex lg:hidden items-center justify-center gap-2 text-xs sm:text-sm font-medium px-4 py-2 rounded-full border border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
            >
              <span>{showMobileRadar ? "Hide Skill Radar Preview" : "See Skill Radar Preview"}</span>
              <span className={`${showMobileRadar ? "rotate-180" : ""} transition-transform`}>▼</span>
            </button>

            {/* TRUST BAR */}
            <div className="mt-4 grid grid-cols-4 gap-6 text-xs sm:text-sm text-gray-700 dark:text-gray-300 place-items-center">
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-gray-100">5,000+</p>
                <p className="opacity-85">Quizzes</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-gray-100">Weekly</p>
                <p className="opacity-85">Challenges</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-gray-100">Skill Radar</p>
                <p className="opacity-85">Tracking</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-gray-100">Rewards</p>
                <p className="opacity-85">Coins + Streaks</p>
              </div>
            </div>

            {/* DISCLAIMER */}
            <p className="mt-3 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              🚀 No credit card needed — Built for students & early devs
            </p>

            {/* MOBILE RADAR PREVIEW */}
            <div className={`lg:hidden transition-all duration-300 overflow-hidden ${showMobileRadar ? "max-h-[540px]" : "max-h-0"}`}>
              {showMobileRadar && (
                <div className="mt-6">
                  <RadarCard compact />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: RADAR (desktop only) */}
          <div className="hidden lg:flex flex-1 justify-center">
            <RadarCard />
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Build Skills With Clarity, Not Chaos</h2>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Combine Skill Radar, challenges & analytics to turn your effort into visible growth.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureItems.map((item, idx) => (
              <div
                key={item.title}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl transition"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3 font-semibold">
                  {idx + 1}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm sm:text-base dark:text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-20 bg-slate-50 dark:bg-gray-950/70">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">Your Journey With YouLearnHub</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {howSteps.map((step) => (
              <div key={step.number} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg sm:text-xl font-bold mb-3">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm sm:text-base dark:text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">Learners Turning Practice Into Offers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white dark:bg-gray-900 p-7 rounded-2xl border border-gray-200 dark:border-gray-800 shadow">
                <div className="text-3xl text-emerald-500 mb-2">“</div>
                <p className="text-sm sm:text-base dark:text-gray-300 mb-3">{t.quote}</p>
                <p className="text-sm font-semibold">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-900 text-center">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to See Your Skill Radar Grow?</h2>
          <p className="text-sm sm:text-base mb-6 dark:text-gray-300">
            Join learners who are turning weekly practice into real opportunities.
          </p>
          <Link
            to={user ? "/dashboard" : "/register"}
            className="px-10 py-4 text-sm sm:text-base font-semibold bg-emerald-500 text-white rounded-lg shadow-lg hover:scale-[1.03] transition"
          >
            {user ? "Go to Dashboard" : "Join Now — It’s Free"}
          </Link>
          <p className="mt-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">No payment required. No spam.</p>
        </div>
      </section>

      {/* MOBILE STICKY CTA */}
      <div className="fixed bottom-4 inset-x-4 z-30 lg:hidden">
        <div className="bg-gray-900/90 text-white rounded-2xl px-4 py-3 shadow-xl border border-gray-700 flex items-center justify-between gap-3">
          <div className="text-[11px] leading-snug">
            <p className="font-semibold">{user ? "Continue Learning" : "Start Building Your Skill Radar"}</p>
            <p className="opacity-75">{user ? "Pick up where you left." : "Takes under 1 minute."}</p>
          </div>
          <Link
            to={user ? "/dashboard" : "/register"}
            className="px-3 py-2 text-[11px] font-semibold bg-emerald-500 rounded-lg shadow hover:bg-emerald-600"
          >
            {user ? "Open" : "Start"}
          </Link>
        </div>
      </div>

    </div>
  );
}



/* ------------------------
    RADAR CARD COMPONENT
------------------------ */
function RadarCard({ compact = false }) {
  return (
    <div
      className={`relative bg-gradient-to-br from-gray-900 via-gray-950 to-emerald-900/90 rounded-3xl ${
        compact ? "p-4" : "p-7"
      } shadow-2xl border border-emerald-500/30 overflow-hidden transform transition hover:-translate-y-1 hover:scale-[1.01] hover:shadow-emerald-500/40`}
    >
      {/* Glow Effect */}
      <div className="absolute -top-28 -right-32 w-72 h-72 bg-emerald-500/20 blur-3xl rounded-full" />

      <header className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/70">Skill Radar</p>
          <p className="text-sm font-semibold text-white">Full-Stack Learning Profile</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
          Live Preview
        </span>
      </header>

      <div className="relative mb-6 flex items-center justify-center">
        <div className="relative rounded-full border border-emerald-500/40 bg-emerald-500/5 w-52 h-52 flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full border border-emerald-500/30" />
          <div className="absolute w-24 h-24 rounded-full border border-emerald-500/20" />
          <div className="absolute w-px h-full bg-emerald-500/20" />
          <div className="absolute h-px w-full bg-emerald-500/20" />

          <svg viewBox="0 0 100 100" className="w-32 h-32 text-emerald-400">
            <polygon
              points="50,15 78,40 65,82 35,82 22,40"
              className="fill-emerald-400/30 stroke-emerald-300/70"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Labels */}
        <span className="absolute -top-3 text-[10px] text-emerald-100">DSA</span>
        <span className="absolute top-1/2 -right-4 text-[11px] text-emerald-100">Web</span>
        <span className="absolute -bottom-2 text-[11px] text-emerald-100">CS</span>
        <span className="absolute top-1/2 -left-4 text-[11px] text-emerald-100">Aptitude</span>
        <span className="absolute top-8 right-10 text-[11px] text-emerald-100">Projects</span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-[11px] text-gray-100 mb-4">
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-gray-300 text-[11px]">Radar Score</p>
          <p className="text-sm font-bold">78 / 100</p>
          <p className="text-[10px] text-emerald-200 mt-1">+12 this month</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-gray-300 text-[11px]">Weakest</p>
          <p className="text-sm font-bold">Aptitude</p>
          <p className="text-[10px] text-amber-200 mt-1">3 focused quizzes</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-gray-300 text-[11px]">Streak</p>
          <p className="text-sm font-bold">6 days</p>
          <p className="text-[10px] text-emerald-200 mt-1">Don’t break it 💪</p>
        </div>
      </div>

      <p className="text-[11px] text-gray-300 leading-relaxed">
        Every quiz updates this radar. Weak areas trigger focused challenges so you’re always leveling the right skills.
      </p>
    </div>
  );
}

export default Home;
