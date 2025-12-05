// src/layouts/PublicLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Sun, Moon, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Footer from "../components/Footer";
import CookieConsent from "../components/CookieConsent";
import api from "../utils/api";

export default function PublicLayout() {
  const { token, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [platformName, setPlatformName] = useState("YouLearnHub");
  const [logoUrl, setLogoUrl] = useState(null);

  const fetchBranding = async () => {
    try {
      const res = await api.get("/system/settings");
      const data = res.data || {};

      setPlatformName(data.platformName?.trim() || "YouLearnHub");
      setLogoUrl(data.logoUrl?.trim() || null);
    } catch (error) {
      console.error("Brand fetch failed:", error);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    const refreshBranding = () => fetchBranding();
    window.addEventListener("brandingUpdated", refreshBranding);
    return () => window.removeEventListener("brandingUpdated", refreshBranding);
  }, []);

  /* ------------------------------
      Navigation Groups
  ------------------------------ */
  const groupedLinks = [
    { label: "Home", to: "/" },
    {
      label: "Discover",
      items: [
        { to: "/explore", label: "Explore" },
        { to: "/announcements", label: "Announcements" },
      ],
    },
    {
      label: "Help",
      items: [
        { to: "/about", label: "About Us" },
        { to: "/contact", label: "Contact" },
        { to: "/support", label: "Support" },
      ],
    },
  ];

  /* ------------------------------
      Premium Nav Item Component
  ------------------------------ */
  const NavItem = ({ to, label }) => (
    <NavLink
      to={to}
      onClick={() => {
        setMenuOpen(false);
        setOpenDropdown(null);
      }}
      className={({ isActive }) =>
        `block px-3 py-2 text-sm rounded-lg transition-all select-none
        ${
          isActive
            ? "font-semibold bg-emerald-50 dark:bg-teal-900/30 text-emerald-700 dark:text-teal-300 shadow-sm"
            : "text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-teal-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/80"
        }`
      }
    >
      {label}
    </NavLink>
  );

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  /* ============================================================
        MAIN LAYOUT WITH PREMIUM NAVBAR
     ============================================================ */
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-all">
      
      {/* ============================
            PREMIUM NAVBAR
      ============================ */}
      <nav className="
        sticky top-0 z-50 backdrop-blur-xl
        bg-white/70 dark:bg-gray-950/70
        border-b border-gray-200/60 dark:border-gray-800/70
        shadow-[0_4px_20px_rgba(0,0,0,0.04)]
        transition-colors
      ">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">

          {/* LOGO + BRAND */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group"
          >
            <div className="
              w-11 h-11 rounded-xl overflow-hidden bg-gray-900 dark:bg-gray-800 
              flex items-center justify-center shadow-lg shadow-emerald-500/10 dark:shadow-teal-600/20
            ">
              {logoUrl ? (
                <img src={logoUrl} alt="Brand Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-md font-bold tracking-wide">
                  {platformName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <span className="
              text-xl font-bold tracking-wide transition
              text-gray-900 dark:text-white
              group-hover:text-emerald-600 dark:group-hover:text-teal-400
            ">
              {platformName}
            </span>
          </button>

          {/* ===============================
                DESKTOP NAV
          =============================== */}
          <div className="hidden md:flex items-center gap-6">

            {groupedLinks.map((group, index) => (
              <div key={group.label} className="relative">
                {!group.items ? (
                  <NavItem {...group} />
                ) : (
                  <>
                    <button
                      onClick={() =>
                        setOpenDropdown(openDropdown === index ? null : index)
                      }
                      className="
                        flex items-center gap-1 px-2 py-2 text-sm font-medium select-none
                        text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-teal-400
                        transition rounded-lg
                      "
                    >
                      {group.label}
                      {openDropdown === index ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* Premium dropdown */}
                    <div
                      className={`
                        absolute left-0 mt-2 w-48 rounded-xl overflow-hidden
                        border border-gray-200 dark:border-gray-800
                        bg-white/90 dark:bg-gray-900/95 backdrop-blur-lg
                        shadow-xl shadow-gray-900/10
                        transition-all duration-200
                        ${openDropdown === index
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-3 pointer-events-none"}
                      `}
                    >
                      {group.items.map((item) => (
                        <NavItem key={item.label} {...item} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* USER AUTH BUTTONS */}
            {!token ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="
                    px-4 py-1.5 rounded-lg border font-medium text-sm
                    bg-white/60 dark:bg-white/5 
                    hover:bg-gray-100 dark:hover:bg-gray-800
                    transition
                  "
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="
                    px-4 py-1.5 rounded-lg text-sm font-semibold 
                    text-white bg-emerald-600 dark:bg-teal-600
                    shadow-md hover:bg-emerald-700 dark:hover:bg-teal-500
                    transition
                  "
                >
                  Get Started
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="
                    px-4 py-1.5 rounded-lg text-sm font-semibold 
                    bg-emerald-600 dark:bg-teal-600 text-white 
                    shadow hover:bg-emerald-700 dark:hover:bg-teal-500
                  "
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="
                    px-3 py-1.5 text-sm rounded-lg border
                    hover:bg-gray-100 dark:hover:bg-gray-800 transition
                  "
                >
                  Logout
                </button>
              </>
            )}

            {/* THEME TOGGLE (premium floating button) */}
            <button
              onClick={toggleTheme}
              className="
                w-10 h-10 rounded-full flex items-center justify-center
                bg-gray-200/70 dark:bg-gray-800/80
                border border-gray-300 dark:border-gray-700
                hover:ring-2 ring-emerald-400 dark:ring-teal-500
                transition shadow-sm
              "
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* ===============================
                MOBILE MENU TOGGLE
          =============================== */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-2xl text-gray-900 dark:text-white"
          >
            {menuOpen ? "✖" : "☰"}
          </button>
        </div>

        {/* ===============================
              PREMIUM MOBILE NAV PANEL
        =============================== */}
        {menuOpen && (
          <div className="
            md:hidden px-4 py-4 space-y-3 
            border-t border-gray-200 dark:border-gray-800
            bg-white/90 dark:bg-gray-950/95 backdrop-blur-xl
            shadow-inner transition-all
          ">
            {groupedLinks.map((group, index) => (
              <div key={group.label}>
                {!group.items ? (
                  <NavItem {...group} />
                ) : (
                  <>
                    <button
                      onClick={() =>
                        setOpenDropdown(openDropdown === index ? null : index)
                      }
                      className="w-full flex justify-between py-2 text-sm"
                    >
                      {group.label}
                      {openDropdown === index ? <ChevronUp /> : <ChevronDown />}
                    </button>

                    {openDropdown === index && (
                      <div className="ml-4 space-y-1">
                        {group.items.map((item) => (
                          <NavItem key={item.label} {...item} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {!token ? (
              <>
                <NavItem to="/login" label="Login" />
                <NavItem to="/register" label="Get Started" />
              </>
            ) : (
              <>
                <NavItem to="/dashboard" label="Dashboard" />

                <button
                  onClick={handleLogout}
                  className="block w-full px-3 py-2 text-left text-sm text-red-500 rounded-md"
                >
                  Logout
                </button>
              </>
            )}

            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="
                w-full py-2 rounded-lg
                bg-gray-200 dark:bg-gray-800
                hover:ring-2 ring-emerald-400 dark:ring-teal-500 transition
              "
            >
              Toggle Theme
            </button>
          </div>
        )}
      </nav>

      {/* CONTENT */}
      <main className="flex-grow animate-fade-in">
        <Outlet />
      </main>

      <CookieConsent />
      <Footer />
    </div>
  );
}
