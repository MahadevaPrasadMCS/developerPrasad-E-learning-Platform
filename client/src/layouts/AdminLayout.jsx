import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, LogOut, Settings, BarChart3, Users, Gift, FileUp, Megaphone, Layers3 } from "lucide-react";

function AdminLayout() {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // 🧭 Refined, meaningful section names and logical grouping
  const links = [
    { label: "🏠 Overview Dashboard", to: "/admin", icon: BarChart3 },
    { label: "⚙️ System Controls", to: "/admin/control-panel", icon: Settings },
    { label: "📊 Quiz Insights", to: "/admin/quiz-analytics", icon: Layers3 },
    { label: "📝 Manage Quizzes", to: "/admin/manage-quiz", icon: FileUp },
    { label: "📂 Upload Learning Resources", to: "/admin/upload-resource", icon: FileUp },
    { label: "📣 Announcements", to: "/admin/announcements", icon: Megaphone },
    { label: "👥 Manage Users", to: "/admin/users", icon: Users },
    { label: "🧑‍💼 Manage Admins", to: "/admin/admin-users", icon: Users },
    { label: "🎁 Reward Management", to: "/admin/rewards", icon: Gift },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition">
      {/* 🧱 Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-5 flex flex-col justify-between shadow-lg">
        {/* 🔹 Logo Section */}
        <div>
          <div
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 mb-8 cursor-pointer select-none"
          >
            <img
              src={require("../assets/logo.png")}
              alt="Logo"
              className="h-9 w-9 rounded-full"
            />
            <h2 className="font-bold text-lg text-teal-600 dark:text-teal-400 tracking-wide">
              YouLearn Admin
            </h2>
          </div>

          {/* 📑 Navigation Links */}
          <nav className="space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group relative flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-300 overflow-hidden
                   ${
                     isActive
                       ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md font-semibold"
                       : "text-gray-700 dark:text-gray-200 hover:bg-teal-100/70 dark:hover:bg-gray-700/60"
                   }`
                }
              >
                {/* Left Accent Bar for Active Item */}
                <span
                  className={`absolute left-0 top-0 h-full w-1 rounded-r-md bg-teal-400 transition-all duration-300 ${
                    window.location.pathname === to
                      ? "opacity-100 scale-y-100"
                      : "opacity-0 scale-y-0"
                  }`}
                ></span>

                {Icon && <Icon size={16} className="shrink-0" />}
                <span className="relative z-10">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ⚙️ Sidebar Footer */}
        <div className="flex flex-col gap-2 pt-4 border-t dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 justify-center px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />} Toggle Theme
          </button>

          <button
            onClick={() => logout(user?.role)}
            className="flex items-center gap-2 justify-center px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-all duration-300 shadow-sm hover:shadow-lg"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* 🧩 Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
