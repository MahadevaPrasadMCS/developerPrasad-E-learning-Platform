import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, LogOut } from "lucide-react";

function AdminLayout() {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const links = [
    { label: "Dashboard", to: "/admin" },
    { label: "Control Panel", to: "/admin/control-panel" },
    { label: "Quiz Analytics", to: "/admin/quiz-analytics" },
    { label: "Manage Quiz", to: "/admin/manage-quiz" },
    { label: "Upload Resource", to: "/admin/upload-resource" },
    { label: "Announcements", to: "/admin/announcements" },
    { label: "Users", to: "/admin/users" },
    { label: "Admin Users", to: "/admin/admin-users" },
    { label: "Rewards", to: "/admin/rewards" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-5 flex flex-col justify-between shadow-lg">
        {/* Logo Section */}
        <div>
          <div
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 mb-8 cursor-pointer select-none"
          >
            <img
              src={require("../assets/logo.png")}
              alt="Logo"
              className="h-8 w-8 rounded-full"
            />
            <h2 className="font-semibold text-teal-600 dark:text-teal-400">
              Admin Panel
            </h2>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `group relative flex items-center px-3 py-2 rounded-md font-medium transition-all duration-300 overflow-hidden
                   ${
                     isActive
                       ? "bg-teal-500 text-white shadow-md font-semibold"
                       : "text-gray-700 dark:text-gray-200 hover:bg-teal-100 dark:hover:bg-gray-700"
                   }`
                }
              >
                {/* Left Accent Bar (active state) */}
                <span
                  className={`absolute left-0 top-0 h-full w-1 rounded-r-md bg-teal-400 transition-all duration-300 ${
                    window.location.pathname === link.to
                      ? "opacity-100 scale-y-100"
                      : "opacity-0 scale-y-0"
                  }`}
                ></span>

                <span className="relative z-10">{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col gap-2 pt-4 border-t dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 justify-center px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />} Theme
          </button>
          <button
            onClick={() => logout(user?.role)}
            className="flex items-center gap-2 justify-center px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-all duration-300 shadow-sm hover:shadow-lg"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
