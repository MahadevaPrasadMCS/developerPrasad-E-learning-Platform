import React, { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Sun, Moon, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Footer from "../components/Footer";
import CookieConsent from "../components/CookieConsent";

function UserLayout() {
  const { token, user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [dropdown, setDropdown] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownTimer = useRef(null);

  const handleLogout = () => logout(user?.role);

  // ✅ Enhanced NavItem stays INSIDE the component
  const NavItem = ({ to, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group
        ${
          isActive
            ? "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-900/40 font-semibold"
            : "text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-gray-800/60"
        }`
      }
      onClick={() => setMenuOpen(false)}
    >
      {label}
      <span
        className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-teal-500 dark:bg-teal-400 rounded-full transition-all duration-300 group-hover:w-3/4 ${
          window.location.pathname === to ? "w-3/4" : ""
        }`}
      ></span>
    </NavLink>
  );

  const groupedLinks = [
    {
      label: "Your Learning",
      items: [
        { label: "Tutorials", to: "/tutorials" },
        { label: "Learning-resources", to: "/learn" },
        { label: "Quiz", to: "/quiz" },
      ],
    },
    {
      label: "Community",
      items: [
        { label: "Leaderboard", to: "/leaderboard" },
        { label: "Community", to: "/community" },
      ],
    },
    {
      label: "Resources",
      items: [
        { label: "Store", to: "/store" },
        { label: "Announcements", to: "/announcements" },
      ],
    },
    {
      label: "Profile",
      items: [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Wallet", to: "/wallet" },
      ],
    },
  ];

  const moreLinks = [
    { label: "Explore", to: "/explore" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
    { label: "Support", to: "/support" },
  ];

  useEffect(() => {
    return () => {
      if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    };
  }, []);

  // ✅ Now your return statement is inside the component
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-lg shadow-md border-b border-gray-100 dark:border-gray-800 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <img
              src={require("../assets/logo.png")}
              alt="logo"
              className="h-9 w-9 rounded-full"
            />
            <h1 className="text-xl font-semibold text-teal-600 dark:text-teal-400 tracking-wide">
              YouLearnHub
            </h1>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center gap-3">
            {/* (Your existing nav link and dropdown logic stays here) */}
          </ul>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {menuOpen ? "✖" : "☰"}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition">
        <Outlet />
      </main>

      <CookieConsent />
      <Footer />
    </div>
  );
}

export default UserLayout;
