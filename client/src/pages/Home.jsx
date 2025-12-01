// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Typewriter from "typewriter-effect";
import ParticlesBG from "../components/ParticlesBG";
import api from "../utils/api";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

function Home() {
  const { user } = useAuth();
  const [showMobileRadar, setShowMobileRadar] = useState(false);

  const [platformName, setPlatformName] = useState("YouLearnHub");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get("/system/settings");
        const data = res.data || {};

        setPlatformName(data.platformName || "YouLearnHub");
        setHeroTitle(data.homepageBanner?.title || "");
        setHeroSubtitle(data.homepageBanner?.subtitle || "");
        setHeroImageUrl(data.homepageBanner?.imageUrl || "");

        document.title = `${data.platformName || "YouLearnHub"} – Practice Tech Smarter`;
      } catch (err) {
        console.error("Failed to load system settings for Home:", err);
      }
    }

    loadSettings();
  }, []);

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
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="relative flex justify-center w-full mx-auto px-4 sm:px-6 lg:px-12 pt-20 pb-14 sm:pt-24 sm:pb-20 lg:pt-24 lg:pb-24"
        style={{
          backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {heroImageUrl && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/75 dark:from-black/80 dark:via-black/75 dark:to-black/80 backdrop-blur-[2px]" />
        )}

        <ParticlesBG />

        <div className="relative z-10 max-w-[1600px] w-full flex flex-col lg:flex-row items-center gap-14">

          {/* LEFT CONTENT */}
          <motion.div
            variants={fadeUp}
            className="flex-1 flex flex-col justify-center space-y-6"
          >
            {/* Title + Subtitle */}
            <div className="text-center lg:text-left max-w-2xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                {heroTitle || (
                  <>
                    Make Your
                    <span className="text-emerald-400"> Skill Gaps </span>
                    Visible. Then Close Them.
                  </>
                )}
              </h1>

              <div className="mt-4 text-base sm:text-lg lg:text-xl min-h-[3rem] text-gray-200 dark:text-gray-100 leading-snug">
                {heroSubtitle ? (
                  <p>{heroSubtitle}</p>
                ) : (
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
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="relative group w-full sm:w-auto inline-flex justify-center px-8 py-3 text-sm sm:text-base font-semibold rounded-lg shadow-lg shadow-emerald-500/40 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-600 text-white transition-transform hover:scale-[1.04] ring-1 ring-emerald-400/50"
              >
                <span className="relative z-10">
                  {user ? "Open Dashboard" : "Start Free in 60 Sec"}
                </span>
              </Link>

              {!user && (
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex justify-center px-8 py-3 text-sm sm:text-base font-medium bg-black/20 dark:bg-gray-900/70 hover:bg-gray-200/20 dark:hover:bg-gray-800/80 rounded-lg border border-gray-400/50 dark:border-gray-700 transition backdrop-blur"
                >
                  Already have an account?
                </Link>
              )}
            </div>

            {/* Mobile Radar Toggle */}
            <button
              onClick={() => setShowMobileRadar(!showMobileRadar)}
              className="mt-3 inline-flex lg:hidden items-center justify-center gap-2 text-xs sm:text-sm font-medium px-4 py-2 rounded-full border border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/30 text-emerald-100 hover:bg-emerald-100/30 dark:hover:bg-emerald-800 transition backdrop-blur-sm"
            >
              <span>{showMobileRadar ? "Hide Radar" : "Skill Radar Preview"}</span>
              <span
                className={`${
                  showMobileRadar ? "rotate-180" : ""
                } transition-transform`}
              >
                ▼
              </span>
            </button>

            {/* Mobile Radar */}
            <div
              className={`lg:hidden transition-all duration-500 overflow-hidden ${
                showMobileRadar ? "max-h-[540px] mt-4" : "max-h-0"
              }`}
            >
              {showMobileRadar && (
                <div className="mt-2">
                  <RadarCard compact />
                </div>
              )}
            </div>
          </motion.div>

          {/* RIGHT: Radar (desktop) */}
          <motion.div
            variants={fadeUp}
            className="hidden lg:flex flex-1 justify-center"
          >
            <RadarCard />
          </motion.div>
        </div>
      </motion.section>

      {/* FEATURES */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="py-20 sm:py-24"
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Build Skills With Clarity, Not Chaos
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-300 max-w-2xl mx-auto">
            Combine Skill Radar, challenges & analytics to turn your effort into
            visible growth.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureItems.map((item, idx) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3 font-semibold">
                  {idx + 1}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base dark:text-gray-300">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* HOW IT WORKS */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="py-20 sm:py-24 bg-slate-50 dark:bg-gray-950/70"
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            Your Journey With {platformName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {howSteps.map((step) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg sm:text-xl font-bold mb-3 ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-500/40">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm sm:text-base dark:text-gray-300">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* TESTIMONIALS */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="py-20 sm:py-24"
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            Learners Turning Practice Into Offers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="bg-white dark:bg-gray-900 p-7 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg"
              >
                <div className="text-3xl text-emerald-500 mb-2">“</div>
                <p className="text-sm sm:text-base dark:text-gray-300 mb-3">
                  {t.quote}
                </p>
                <p className="text-sm font-semibold">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FINAL CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="py-20 sm:py-24 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-900 text-center"
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to See Your Skill Radar Grow?
          </h2>
          <p className="text-sm sm:text-base mb-6 dark:text-gray-300">
            Join learners who are turning weekly practice into real opportunities.
          </p>
          <Link
            to={user ? "/dashboard" : "/register"}
            className="px-10 py-4 text-sm sm:text-base font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-500/40 hover:scale-[1.03] transition-transform ring-1 ring-emerald-400/50"
          >
            {user ? "Go to Dashboard" : `Join ${platformName}`}
          </Link>
          <p className="mt-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            No payment required. No spam.
          </p>
        </div>
      </motion.section>

      {/* MOBILE STICKY CTA */}
      {!user && (
        <div className="fixed bottom-4 inset-x-4 z-30 lg:hidden">
          <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 text-white rounded-2xl px-4 py-3 shadow-xl border border-gray-700 flex items-center justify-between gap-3 backdrop-blur">
            <div className="text-[11px] leading-snug">
              <p className="font-semibold">Start Building Your Skill Radar</p>
              <p className="opacity-75">Create your account in under a minute.</p>
            </div>
            <Link
              to="/register"
              className="px-3 py-2 text-[11px] font-semibold bg-emerald-500 rounded-lg shadow hover:bg-emerald-600"
            >
              Start
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------
    RADAR CARD COMPONENT
------------------------ */
function RadarCard({ compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative bg-gradient-to-br from-gray-900 via-gray-950 to-emerald-900/90 rounded-3xl ${
        compact ? "p-4" : "p-7"
      } shadow-2xl border border-emerald-500/30 overflow-hidden transform hover:-translate-y-1 hover:scale-[1.01] hover:shadow-emerald-500/40 transition-transform`}
    >
      <div className="absolute -top-28 -right-32 w-72 h-72 bg-emerald-500/20 blur-3xl rounded-full" />

      <header className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/70">
            Skill Radar
          </p>
          <p className="text-sm font-semibold text-white">
            Full-Stack Learning Profile
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
          Live Preview
        </span>
      </header>

      {/* Radar Visualization */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="relative rounded-full border border-emerald-500/40 bg-emerald-500/5 w-52 h-52 flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full border border-emerald-500/30" />
          <div className="absolute w-24 h-24 rounded-full border border-emerald-500/20" />
          <div className="absolute w-px h-full bg-emerald-500/20" />
          <div className="absolute h-px w-full bg-emerald-500/20" />

          <svg viewBox="0 0 100 100" className="w-32 h-32 text-emerald-400">
            {/* Polygon roughly matching DSA (top), Web (right), CS (bottom), Aptitude (left), Projects (top-right) */}
            <polygon
              points="50,15 78,40 65,82 35,82 22,40"
              className="fill-emerald-400/30 stroke-emerald-300/70"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Properly aligned labels around radar */}
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 transform text-[10px] text-emerald-100">
          DSA
        </span>
        <span className="absolute top-1/2 -right-5 -translate-y-1/2 transform text-[11px] text-emerald-100">
          Web
        </span>
        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 transform text-[11px] text-emerald-100">
          CS
        </span>
        <span className="absolute top-1/2 -left-7 -translate-y-1/2 transform text-[11px] text-emerald-100">
          Aptitude
        </span>
        <span className="absolute top-6 right-4 text-[11px] text-emerald-100">
          Projects
        </span>
      </div>

      {/* Stats */}
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
        Every quiz updates this radar. Weak areas trigger focused challenges so
        you’re always leveling the right skills.
      </p>
    </motion.div>
  );
}

export default Home;
