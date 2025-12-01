// src/layouts/PublicLayout.jsx

import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Sun, Moon, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Footer from "../components/Footer";
import CookieConsent from "../components/CookieConsent";
import api from "../utils/api";

function PublicLayout() {
  const { token, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [platformName, setPlatformName] = useState("YouLearnHub");
  const [logoUrl, setLogoUrl] = useState(null);

  // Unified branding fetch aligned with backend response
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

  // Listen for live branding updates
  useEffect(() => {
    const refreshBranding = () => fetchBranding();
    window.addEventListener("brandingUpdated", refreshBranding);
    return () => window.removeEventListener("brandingUpdated", refreshBranding);
  }, []);

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

  const NavItem = ({ to, label }) => (
    <NavLink
      to={to}
      onClick={() => {
        setMenuOpen(false);
        setOpenDropdown(null);
      }}
      className={({ isActive }) =>
        `block px-3 py-2 text-sm rounded-lg transition-all ${
          isActive
            ? "font-semibold text-teal-600 dark:text-teal-300 bg-teal-50 dark:bg-gray-800 shadow-sm"
            : "text-gray-700 dark:text-gray-200 hover:text-teal-600 hover:bg-gray-100 dark:hover:bg-gray-800"
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

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 transition-all">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/90 border-b border-gray-200 dark:border-gray-800 shadow-sm backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group"
          >
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-teal-500/20 bg-gray-900 flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt="Brand Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-md font-bold tracking-wide">
                  {platformName?.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-teal-500 transition">
              {platformName}
            </span>
          </button>

          {/* Desktop Menu */}
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
                      className="flex items-center gap-1 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-teal-600 transition"
                    >
                      {group.label}
                      {openDropdown === index ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>

                    <div
                      className={`absolute left-0 mt-2 w-48 rounded-xl border bg-white dark:bg-gray-900 shadow-xl overflow-hidden transition-all duration-200 ${
                        openDropdown === index
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-3 pointer-events-none"
                      }`}
                    >
                      {group.items.map((item) => (
                        <NavItem key={item.label} {...item} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Auth Controls */}
            {!token ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-1.5 text-sm font-medium border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-4 py-1.5 text-sm font-semibold bg-teal-500 text-white rounded-lg shadow-md hover:bg-teal-600 transition"
                >
                  Get Started
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-4 py-1.5 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition shadow"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Logout
                </button>
              </>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 hover:ring-2 ring-teal-400 transition"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-2xl text-gray-900 dark:text-white"
          >
            {menuOpen ? "✖" : "☰"}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden p-4 space-y-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
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
                      className="w-full flex justify-between py-2"
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

            <button
              onClick={toggleTheme}
              className="w-full py-2 rounded-lg bg-gray-200 dark:bg-gray-800 transition"
            >
              Toggle Theme
            </button>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className="flex-grow animate-fade-in">
        <Outlet />
      </main>

      <CookieConsent />
      <Footer />
    </div>
  );
}

export default PublicLayout;
