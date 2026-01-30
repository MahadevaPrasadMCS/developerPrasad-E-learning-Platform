// src/pages/Home.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Typewriter from "typewriter-effect";
import { motion } from "framer-motion";
import ParticlesBG from "../components/ParticlesBG";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

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
   Premium Theme Hook
---------------------- */
function usePremiumTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored) return stored;
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
      return "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, setTheme };
}

/* ----------------------
   Reusable Buttons
---------------------- */
function PrimaryButton({ children, to, onClick, className = "", small = false, ariaLabel }) {
  const padding = small ? "px-4 py-2 text-sm" : "px-8 py-3 text-base";

  const inner = (
    <span
      className={`${padding} inline-flex items-center justify-center rounded-xl font-semibold transition ${className}`}
      aria-label={ariaLabel}
    >
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

function SecondaryButton({ children, to, onClick, className = "", small = false, ariaLabel }) {
  const padding = small ? "px-3 py-2 text-sm" : "px-6 py-3 text-base";

  const inner = (
    <span
      className={`inline-flex ${padding} items-center justify-center rounded-xl font-medium transition border backdrop-blur-sm ${className}`}
      aria-label={ariaLabel}
    >
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
   Radar Card
---------------------- */
function RadarCard({ compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-3xl ${compact ? "p-4" : "p-7"} overflow-hidden
        bg-gradient-to-br from-white/60 via-slate-50 to-emerald-50
        dark:from-gray-900/80 dark:via-[#031425]/70 dark:to-teal-900/40
        border border-gray-200/30 dark:border-teal-600/20 shadow-2xl`}
    >
      <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full blur-3xl bg-gradient-to-br from-teal-400/20 to-transparent pointer-events-none" />

      <header className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300/80">
            Skill Radar
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Full-Stack Learning Profile
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wide bg-teal-100/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-100 border border-teal-300/20">
          Demo
        </span>
      </header>

      <div className="relative mb-6 flex items-center justify-center">
        <div className="relative w-52 h-52 rounded-full border border-teal-300/10 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-36 h-36">
            <polygon
              points="50,18 78,40 66,80 34,80 22,40"
              className="fill-teal-400/20 stroke-teal-300/50"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      </div>

      <p className="text-[11px] text-gray-600 dark:text-gray-300">
        Demo visualization. Real stats appear after you start practicing.
      </p>
    </motion.div>
  );
}

/* ----------------------
   MAIN HOME PAGE
---------------------- */
export default function Home() {
  const { user } = useAuth();
  const { theme } = usePremiumTheme();

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
        document.title = `${data.platformName || "YouLearnHub"} – Practice Smarter`;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Home settings load failed:", err);
        }
      }
    }
    loadSettings();
  }, []);

  const mobileDrawerKey = useMemo(() => `drawer-${theme}`, [theme]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-emerald-50 dark:from-gray-950 dark:via-[#021022] dark:to-teal-900/40">
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="relative px-4 sm:px-6 lg:px-12 pt-20 pb-16"
        style={{
          backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-white/50 dark:bg-black/65 backdrop-blur-sm" />
        <ParticlesBG />

        <div className="relative z-10 max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-12">
          <motion.div variants={fadeUp} className="flex-1 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold">
              {heroTitle || (
                <>
                  Learn Smarter{" "}
                  <span className="text-emerald-600 dark:text-teal-400">Every Week</span>
                </>
              )}
            </h1>

            <div className="text-lg text-gray-700 dark:text-gray-300 min-h-[3rem]">
              {heroSubtitle ? (
                heroSubtitle
              ) : (
                <Typewriter
                  options={{
                    autoStart: true,
                    loop: true,
                    delay: 45,
                    strings: [
                      "Visualize your strengths with Skill Radar.",
                      "Practice weekly. Improve deliberately.",
                      "Prepare smarter for real interviews.",
                    ],
                  }}
                />
              )}
            </div>

            <div className="flex gap-4 flex-wrap">
              <PrimaryButton
                to={user ? "/dashboard" : "/register"}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-teal-500 dark:to-teal-600 text-white"
              >
                {user ? "Open Dashboard" : "Start Free"}
              </PrimaryButton>

              {!user && (
                <SecondaryButton
                  to="/login"
                  className="bg-white/80 dark:bg-white/5 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                >
                  Already have an account?
                </SecondaryButton>
              )}
            </div>

            <button
              onClick={() => setShowMobileRadar(!showMobileRadar)}
              className="lg:hidden text-sm mt-2 text-emerald-700 dark:text-emerald-200"
            >
              {showMobileRadar ? "Hide Radar" : "Preview Skill Radar"}
            </button>

            <div
              key={mobileDrawerKey}
              className={`lg:hidden transition-all overflow-hidden ${
                showMobileRadar ? "max-h-[600px] mt-4" : "max-h-0"
              }`}
            >
              {showMobileRadar && <RadarCard compact />}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="hidden lg:flex flex-1 justify-center">
            <RadarCard />
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
