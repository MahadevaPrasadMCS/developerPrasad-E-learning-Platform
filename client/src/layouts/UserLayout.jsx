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

  const NavItem = ({ to, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-4 py-2 text-sm font-medium transition-colors duration-200 ${
          isActive
            ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500"
            : "text-gray-700 dark:text-gray-200 hover:text-teal-500"
        }`
      }
      onClick={() => setMenuOpen(false)}
    >
      {label}
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

  // 🧹 Clean up dropdown delay timer on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    };
  }, []);

  // 🌙 Navbar
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-lg shadow-md transition-all">
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
          <ul className="hidden md:flex items-center gap-4">
            {!token ? (
              <>
                <NavItem to="/" label="Home" />
                {/* More dropdown for public */}
                <div
                  className="relative"
                  onMouseEnter={() => {
                    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
                    setDropdown("more");
                  }}
                  onMouseLeave={() => {
                    dropdownTimer.current = setTimeout(() => setDropdown(null), 200);
                  }}
                >
                  <button
                    className="flex items-center gap-1 px-3 py-2 hover:text-teal-500 dark:text-gray-200"
                    onClick={() => setDropdown(dropdown === "more" ? null : "more")}
                  >
                    Visit
                    {dropdown === "more" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <div
                    className={`absolute left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[160px] transition-all duration-200 ${
                      dropdown === "more"
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-1 pointer-events-none"
                    }`}
                  >
                    {moreLinks.map((link) => (
                      <NavItem key={link.to} to={link.to} label={link.label} />
                    ))}
                  </div>
                </div>
                <NavItem to="/register" label="Register" />
                <NavItem to="/login" label="Login" />
              </>
            ) : (
              groupedLinks.map((group, idx) => (
                <div
                  key={idx}
                  className="relative"
                  onMouseEnter={() => {
                    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
                    setDropdown(idx);
                  }}
                  onMouseLeave={() => {
                    dropdownTimer.current = setTimeout(() => setDropdown(null), 200);
                  }}
                >
                  <button
                    className="flex items-center gap-1 px-3 py-2 hover:text-teal-500 dark:text-gray-200"
                    onClick={() => setDropdown(dropdown === idx ? null : idx)}
                  >
                    {group.label}
                    {dropdown === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <div
                    className={`absolute left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[180px] transition-all duration-200 ${
                      dropdown === idx
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-1 pointer-events-none"
                    }`}
                  >
                    {group.items.map((i) => (
                      <NavItem key={i.to} to={i.to} label={i.label} />
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Logout */}
            {token && (
              <button
                onClick={handleLogout}
                className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-md text-sm shadow-md transition-transform hover:scale-105"
              >
                Logout
              </button>
            )}
          </ul>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {menuOpen ? "✖" : "☰"}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3 space-y-2 animate-fade-in">
            {!token ? (
              <>
                <NavItem to="/" label="Home" />
                {moreLinks.map((l) => (
                  <NavItem key={l.to} to={l.to} label={l.label} />
                ))}
                <NavItem to="/register" label="Register" />
                <NavItem to="/login" label="Login" />
              </>
            ) : (
              groupedLinks.map((group) => (
                <details key={group.label}>
                  <summary className="cursor-pointer py-2 text-gray-700 dark:text-gray-200 font-medium flex justify-between items-center">
                    {group.label}
                  </summary>
                  <div className="ml-3 space-y-1 mt-1">
                    {group.items.map((i) => (
                      <NavItem key={i.to} to={i.to} label={i.label} />
                    ))}
                  </div>
                </details>
              ))
            )}

            {token && (
              <button
                onClick={handleLogout}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-md text-sm"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition">
        <Outlet />
      </main>

      {/* Cookie Consent */}
      <CookieConsent />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default UserLayout;
