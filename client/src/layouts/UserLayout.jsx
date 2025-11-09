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

  /* 🧭 Card-like animated NavItem */
  const NavItem = ({ to, label, icon: Icon }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
        transform transition-all duration-300 hover:scale-[1.04] hover:shadow-md 
        ${
          isActive
            ? "bg-gradient-to-r from-teal-500/20 to-teal-600/10 text-teal-700 dark:text-teal-300 shadow-sm"
            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/70"
        }`
      }
      onClick={() => setMenuOpen(false)}
    >
      {Icon && <Icon size={15} className="text-teal-500" />}
      <span>{label}</span>
    </NavLink>
  );

  // 🗂️ Organized groups with more meaningful titles
  const groupedLinks = [
    {
      label: "📘 Learn & Practice",
      items: [
        { label: "Tutorials", to: "/tutorials" },
        { label: "Learning Resources", to: "/learn" },
        { label: "Quizzes", to: "/quiz" },
      ],
    },
    {
      label: "🌍 Community & Growth",
      items: [
        { label: "Leaderboard", to: "/leaderboard" },
        { label: "Discussion Forum", to: "/community" },
      ],
    },
    {
      label: "🧰 Tools & Resources",
      items: [
        { label: "Store", to: "/store" },
        { label: "Announcements", to: "/announcements" },
      ],
    },
    {
      label: "👤 Your Space",
      items: [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Wallet", to: "/wallet" },
      ],
    },
  ];

  const moreLinks = [
    { label: "Explore", to: "/explore" },
    { label: "About Us", to: "/about" },
    { label: "Contact", to: "/contact" },
    { label: "Support Center", to: "/support" },
  ];

  /* ⏱ Clean dropdown cleanup */
  useEffect(() => {
    const timer = dropdownTimer.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 🌙 Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-lg shadow-md border-b border-gray-100 dark:border-gray-800 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
          {/* 🔹 Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <img
              src={require("../assets/logo.png")}
              alt="logo"
              className="h-9 w-9 rounded-full"
            />
            <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400 tracking-wide">
              YouLearnHub
            </h1>
          </div>

          {/* 🧭 Desktop Menu */}
          <ul className="hidden md:flex items-center gap-3">
            {!token ? (
              <>
                <NavItem to="/" label="Home" />
                <div
                  className="relative group"
                  onMouseEnter={() => {
                    if (dropdownTimer.current)
                      clearTimeout(dropdownTimer.current);
                    setDropdown("visit");
                  }}
                  onMouseLeave={() => {
                    dropdownTimer.current = setTimeout(
                      () => setDropdown(null),
                      200
                    );
                  }}
                >
                  <button
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      dropdown === "visit"
                        ? "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-900/40"
                        : "text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-gray-800/60"
                    }`}
                  >
                    Visit
                    {dropdown === "visit" ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>

                  <div
                    className={`absolute left-0 mt-2 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[180px] backdrop-blur-md transition-all duration-200 grid gap-1 ${
                      dropdown === "visit"
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
                  className="relative group"
                  onMouseEnter={() => {
                    if (dropdownTimer.current)
                      clearTimeout(dropdownTimer.current);
                    setDropdown(idx);
                  }}
                  onMouseLeave={() => {
                    dropdownTimer.current = setTimeout(
                      () => setDropdown(null),
                      200
                    );
                  }}
                >
                  <button
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      dropdown === idx
                        ? "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-900/40"
                        : "text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-gray-800/60"
                    }`}
                  >
                    {group.label}
                    {dropdown === idx ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>

                  <div
                    className={`absolute left-0 mt-2 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[200px] backdrop-blur-md transition-all duration-200 grid gap-2 ${
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

            {/* 🌞 Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* 🚪 Logout */}
            {token && (
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-3 py-1.5 rounded-lg text-sm shadow-md transition-transform hover:scale-105"
              >
                Logout
              </button>
            )}
          </ul>

          {/* 📱 Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 transition"
          >
            {menuOpen ? "✖" : "☰"}
          </button>
        </div>

        {/* 📱 Mobile Menu */}
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
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-2 rounded-md text-sm shadow-md"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </nav>

      {/* 🌿 Page Content */}
      <main className="flex-grow p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition">
        <Outlet />
      </main>

      <CookieConsent />
      <Footer />
    </div>
  );
}

export default UserLayout;
