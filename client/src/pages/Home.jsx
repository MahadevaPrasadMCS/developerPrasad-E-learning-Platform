// src/pages/Home.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Typewriter from "typewriter-effect";
import { motion } from "framer-motion";
import ParticlesBG from "../components/ParticlesBG";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

/*
  Premium Home.jsx (Option A)
  - Dual premium theme palettes (Light: Emerald/Sage | Dark: Teal/Midnight)
  - Theme persisted to localStorage and applied by toggling `dark` on <html>
  - Unified Primary/Secondary buttons with consistent shadows
  - Glassmorphic RadarCard with label grid (robust on mobile)
  - Hero overlays tuned for contrast in both modes
  - Accessible small theme toggle
*/

/* ----------------------
   Animations
   ---------------------- */
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ----------------------
   Premium theme hook
   - toggles 'dark' class on <html>
   - persists to localStorage
   ---------------------- */
function usePremiumTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored) return stored;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
      return "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return [theme, toggle];
}

/* ----------------------
   Reusable Buttons
   - primary adapts gradient per theme
   - secondary is soft glass / border
   ---------------------- */
function PrimaryButton({ children, to, onClick, className = "", small = false, ariaLabel }) {
  const padding = small ? "px-4 py-2 text-sm" : "px-8 py-3 text-base";
  const inner = (
    <span
      className={`${padding} inline-flex items-center justify-center rounded-xl font-semibold transform-gpu transition duration-150 ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );

  // prefer Link if `to` provided
  return to ? (
    <Link to={to} onClick={onClick} aria-label={ariaLabel}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

function SecondaryButton({ children, to, onClick, className = "", small = false, ariaLabel }) {
  const padding = small ? "px-3 py-2 text-sm" : "px-6 py-3 text-base";
  const style = `inline-flex ${padding} items-center justify-center rounded-xl font-medium transition border backdrop-blur-sm ${className}`;
  const inner = (
    <span className={style} aria-label={ariaLabel}>
      {children}
    </span>
  );

  return to ? (
    <Link to={to} onClick={onClick} aria-label={ariaLabel}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

/* ----------------------
   RadarCard (glassmorphism)
   - label positions via grid (robust)
   - improved color & depth
   ---------------------- */
function RadarCard({ compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-3xl ${compact ? "p-4" : "p-7"} overflow-hidden
        bg-gradient-to-br dark:from-gray-900/80 dark:via-[#031425]/70 dark:to-teal-900/40
        from-white/60 via-slate-50 to-emerald-50 border border-gray-200/30 dark:border-teal-600/20
        shadow-2xl`}
    >
      {/* Decorative glow */}
      <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full blur-3xl bg-gradient-to-br from-teal-400/20 to-transparent pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300/80">Skill Radar</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Full-Stack Learning Profile</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wide bg-teal-100/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-100 border border-teal-300/20">
          Live Preview
        </span>
      </header>

      {/* Radar */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="relative w-52 h-52 rounded-full border border-teal-300/8 bg-gradient-to-b from-black/5 to-transparent flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full border border-teal-300/16" />
          <div className="absolute w-24 h-24 rounded-full border border-teal-300/12" />
          <div className="absolute w-px h-full bg-teal-300/12" />
          <div className="absolute h-px w-full bg-teal-300/12" />

          <svg viewBox="0 0 100 100" className="w-36 h-36">
            <polygon points="50,18 78,40 66,80 34,80 22,40" className="fill-teal-400/20 stroke-teal-300/50" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Labels via grid (resilient) */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          <div className="flex items-start justify-center pt-2 text-[11px] text-gray-700 dark:text-teal-200">DSA</div>
          <div />
          <div className="flex items-start justify-center pt-2 text-[11px] text-gray-700 dark:text-teal-200">Projects</div>

          <div className="flex items-center justify-start pl-2 text-[11px] text-gray-700 dark:text-teal-200">Aptitude</div>
          <div />
          <div className="flex items-center justify-end pr-2 text-[11px] text-gray-700 dark:text-teal-200">Web</div>

          <div className="flex items-end justify-center pb-2 text-[11px] text-gray-700 dark:text-teal-200 col-start-2">CS</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-[11px] text-gray-800 dark:text-gray-200 mb-4">
        <div className="rounded-xl p-3 bg-white/60 dark:bg-white/5 border border-white/10">
          <p className="text-[11px] text-gray-600 dark:text-gray-300">Radar Score</p>
          <p className="text-sm font-bold">78 / 100</p>
          <p className="text-[10px] text-teal-500 dark:text-teal-300 mt-1">+12 this month</p>
        </div>
        <div className="rounded-xl p-3 bg-white/60 dark:bg-white/5 border border-white/10">
          <p className="text-[11px] text-gray-600 dark:text-gray-300">Weakest</p>
          <p className="text-sm font-bold">Aptitude</p>
          <p className="text-[10px] text-amber-400 mt-1">3 focused quizzes</p>
        </div>
        <div className="rounded-xl p-3 bg-white/60 dark:bg-white/5 border border-white/10">
          <p className="text-[11px] text-gray-600 dark:text-gray-300">Streak</p>
          <p className="text-sm font-bold">6 days</p>
          <p className="text-[10px] text-teal-400 mt-1">Don’t break it 💪</p>
        </div>
      </div>

      <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
        Every quiz updates this radar. Weak areas trigger focused challenges so you’re always leveling the right skills.
      </p>
    </motion.div>
  );
}

/* ----------------------
   MAIN HOME PAGE
   ---------------------- */
export default function Home() {
  const { user } = useAuth();
  const [theme, toggleTheme] = usePremiumTheme();

  const [platformName, setPlatformName] = useState("YouLearnHub");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");

  const [showMobileRadar, setShowMobileRadar] = useState(false);

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
        // fail silently — app still works with defaults
        console.error("Failed to load settings for Home:", err);
      }
    }
    loadSettings();
  }, []);

  const mobileDrawerKey = useMemo(() => `drawer-${theme}`, [theme]);

  const featureItems = [
    {
      title: "Skill Radar Intelligence",
      description: "See a live radar of your strengths and gaps across core tech skills so you always know what to work on next.",
    },
    {
      title: "Weekly Role-Based Challenges",
      description: "Attempt curated quizzes aligned to real roles — Frontend, Backend or Data — not random questions.",
    },
    {
      title: "Progress You Can Feel",
      description: "XP, coins, streaks and levels turn consistency into a game while you steadily move towards your goals.",
    },
    {
      title: "Actionable Analytics",
      description: "Topic-wise stats, accuracy, streak history and performance trends help you learn like a professional.",
    },
    {
      title: "Resource Unlocks",
      description: "Redeem coins for curated notes and resources recommended from your performance data.",
    },
    {
      title: "Student-First Community",
      description: "Ask doubts, discuss solutions and share resources in a focused, distraction-free learning space.",
    },
  ];

  const howSteps = [
    {
      number: "1",
      title: "Pick Your Track",
      description: "Choose where you want to grow — DSA, Web, Core CS or Role-based tracks.",
    },
    {
      number: "2",
      title: "Attempt Weekly Challenges",
      description: "Solve quizzes, maintain streaks and earn XP while the system learns how you perform.",
    },
    {
      number: "3",
      title: "Watch Your Skill Radar Evolve",
      description: "See your radar expand as weak areas improve, and use it to decide what to do next every week.",
    },
  ];

  const testimonials = [
    {
      quote: "The Skill Radar made my strengths and weaknesses visible in one screen. It guided exactly what to study before placements.",
      name: "Akhil · Final Year CSE",
    },
    {
      quote: "Instead of random practice, I now focus on low-scoring radar areas. My quiz accuracy and confidence both went up.",
      name: "Sneha · Aspiring Backend Developer",
    },
  ];

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50 dark:from-gray-950 dark:via-[#021022] dark:to-teal-900/40">
      {/* ========================
          HERO SECTION
         ======================== */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="relative w-full mx-auto px-4 sm:px-6 lg:px-12 pt-20 pb-16"
        style={{ backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : "none", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Overlays: different for each theme to ensure legibility */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Light overlay: soft neutral veil so dark text remains readable */}
          <div className="block dark:hidden absolute inset-0 bg-white/50 backdrop-blur-[2px]" />
          {/* Dark overlay: deeper cinematic veil */}
          <div className="hidden dark:block absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
          {/* Soft ambient gradient to balance the right-side radar block */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent to-black/0 dark:to-transparent" />
        </div>

        <ParticlesBG />

        <div className="relative z-10 max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* LEFT */}
          <motion.div variants={fadeUp} className="flex-1 flex flex-col justify-center space-y-6">
            <div className="max-w-2xl text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 dark:text-white">
                {heroTitle || (
                  <>
                    Learn Anything{" "}
                    <span className="text-emerald-600 dark:text-teal-400">Anytime</span>
                  </>
                )}
              </h1>

              <div className="mt-4 text-lg sm:text-xl min-h-[3rem] text-gray-700 dark:text-gray-300 leading-snug">
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
              <PrimaryButton
                to={user ? "/dashboard" : "/register"}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-teal-500 dark:to-teal-600 text-white shadow-[0_12px_40px_rgba(16,185,129,0.12)]"
                ariaLabel="Primary CTA"
              >
                <span>{user ? "Open Dashboard" : "Start Free in 60 Sec"}</span>
              </PrimaryButton>

              {!user && (
                <SecondaryButton
                  to="/login"
                  className="bg-white/80 dark:bg-white/6 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700/40"
                  ariaLabel="Already have an account"
                >
                  Already have an account?
                </SecondaryButton>
              )}

              {/* Theme Toggle - prefer to keep small and accessible */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title="Toggle theme"
                className="ml-0 sm:ml-2 inline-flex items-center justify-center rounded-full p-2 border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-transparent"
              >
                <span className="text-sm">{theme === "dark" ? "☾" : "☼"}</span>
              </button>
            </div>

            {/* Mobile radar toggle */}
            <button
              onClick={() => setShowMobileRadar(!showMobileRadar)}
              className="mt-3 inline-flex lg:hidden items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-full border border-emerald-400 bg-emerald-100/30 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-100 hover:bg-emerald-200/30 dark:hover:bg-emerald-800/40 transition"
            >
              <span>{showMobileRadar ? "Hide Radar" : "Skill Radar Preview"}</span>
              <span className={`${showMobileRadar ? "rotate-180" : ""} transition-transform`}>▼</span>
            </button>

            {/* Expandable mobile radar */}
            <div className={`lg:hidden transition-all duration-400 overflow-hidden ${showMobileRadar ? "max-h-[640px] mt-4" : "max-h-0"}`} key={mobileDrawerKey}>
              {showMobileRadar && (
                <div className="mt-2">
                  <RadarCard compact />
                </div>
              )}
            </div>
          </motion.div>

          {/* RIGHT - large radar on desktop */}
          <motion.div variants={fadeUp} className="hidden lg:flex flex-1 justify-center">
            <div className="w-full max-w-[520px]">
              <RadarCard />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* FEATURES */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="py-20 sm:py-24">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Build Skills With Clarity, Not Chaos</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Combine Skill Radar, challenges & analytics to turn your effort into visible growth.</p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureItems.map((item, idx) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3 font-semibold">
                  {idx + 1}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* HOW IT WORKS */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="py-20 sm:py-24 bg-slate-50 dark:bg-gray-900/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">Your Journey With {platformName}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {howSteps.map((step) => (
              <motion.div key={step.number} variants={fadeUp} className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-600 dark:bg-teal-500 text-white flex items-center justify-center text-lg sm:text-xl font-bold mb-3 ring-4 ring-emerald-500/20 shadow-md">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* TESTIMONIALS */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="py-20 sm:py-24">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">Learners Turning Practice Into Offers</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp} className="bg-white dark:bg-gray-900 p-7 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
                <div className="text-4xl text-teal-500 mb-3">“</div>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3">{t.quote}</p>
                <p className="text-sm font-semibold">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FINAL CTA */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="py-20 sm:py-24 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-900 text-center">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to See Your Skill Radar Grow?</h2>
          <p className="text-sm sm:text-base mb-6 text-gray-600 dark:text-gray-300">Join learners who are turning weekly practice into real opportunities.</p>

          <PrimaryButton to={user ? "/dashboard" : "/register"} className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-teal-500 dark:to-teal-600 text-white shadow-[0_12px_40px_rgba(16,185,129,0.12)]">
            {user ? "Go to Dashboard" : `Join ${platformName}`}
          </PrimaryButton>

          <p className="mt-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">No payment required. No spam.</p>
        </div>
      </motion.section>

      {/* MOBILE STICKY CTA */}
      {!user && (
        <div className="fixed bottom-4 inset-x-4 z-30 lg:hidden">
          <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 text-white rounded-2xl px-4 py-3 shadow-lg border border-gray-700/60 flex items-center justify-between gap-3 backdrop-blur">
            <div className="text-[12px] leading-snug">
              <p className="font-semibold">Start Building Your Skill Radar</p>
              <p className="opacity-75 text-[11px]">Create your account in under a minute.</p>
            </div>
            <Link to="/register" className="px-4 py-2 text-[12px] font-semibold bg-emerald-500 rounded-lg hover:bg-emerald-600 transition">
              Start
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
