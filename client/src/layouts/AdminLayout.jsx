// src/layouts/AdminLayout.jsx
import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  BarChart3,
  Users,
  Gift,
  FileUp,
  Megaphone,
  Layers3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function AdminLayout() {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const sections = [
    {
      title: "Overview",
      items: [{ label: "Dashboard", to: "/admin", icon: BarChart3 }],
    },
    {
      title: "Learning System",
      items: [
        { label: "Quiz Insights", to: "/admin/quiz-analytics", icon: Layers3 },
        { label: "Manage Quizzes", to: "/admin/manage-quiz", icon: FileUp },
        {
          label: "Upload Resources",
          to: "/admin/upload-resource",
          icon: FileUp,
        },
      ],
    },
    {
      title: "People",
      items: [
        { label: "Manage Users", to: "/admin/users", icon: Users },
        { label: "Manage Admins", to: "/admin/admin-users", icon: Users },
      ],
    },
    {
      title: "Engagement",
      items: [
        {
          label: "Announcements",
          to: "/admin/announcements",
          icon: Megaphone,
        },
        { label: "Rewards", to: "/admin/rewards", icon: Gift },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          label: "System Controls",
          to: "/admin/control-panel",
          icon: Settings,
        },
      ],
    },
  ];

  const handleLogout = () => logout(user?.role);

  const toggleSidebarDesktop = () => setSidebarCollapsed((prev) => !prev);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const sidebarBaseWidth = sidebarCollapsed ? 72 : 240;
  const sidebarMarginClass = sidebarCollapsed
    ? "lg:ml-[72px]"
    : "lg:ml-[240px]";

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 overflow-hidden">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: logo + title */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => navigate("/admin")}
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-400 to-sky-500 flex items-center justify-center text-sm shadow-md shadow-emerald-500/40">
            YL
          </div>
          <div className="hidden sm:block">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Admin Panel
            </p>
            <h1 className="text-sm sm:text-base font-semibold">
              YouLearnHub
            </h1>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={openMobileSidebar}
            className="inline-flex lg:hidden items-center justify-center rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/80 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Theme toggle (desktop/tablet) */}
          <button
            onClick={toggleTheme}
            className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/80 px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
            <span className="hidden md:inline">Theme</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium shadow-md shadow-rose-500/30"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden xs:inline">Logout</span>
          </button>

          {/* Compact theme toggle (mobile only) */}
          <button
            onClick={toggleTheme}
            className="sm:hidden inline-flex items-center justify-center rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/80 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </header>

      {/* Desktop / Tablet sidebar – SB-Soft glass */}
      <aside
        className="hidden lg:flex fixed top-16 bottom-0 left-0 z-30 border-r border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/85 backdrop-blur-md shadow-lg shadow-slate-900/10 dark:shadow-slate-900/60 transition-[width] duration-300"
        style={{ width: sidebarBaseWidth }}
      >
        <div className="flex flex-col h-full w-full">
          {/* Sidebar header with toggle */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200/80 dark:border-slate-800">
            <span
              className={`text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide transition-opacity ${
                sidebarCollapsed
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              Navigation
            </span>
            <button
              type="button"
              onClick={toggleSidebarDesktop}
              className="inline-flex items-center justify-center rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/80 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation sections */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
            {sections.map((section) => (
              <div key={section.title} className="space-y-1">
                {!sidebarCollapsed && (
                  <p className="px-3 text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {section.title}
                  </p>
                )}
                <div className="space-y-1">
                  {section.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative
                        ${
                          isActive
                            ? "bg-emerald-500 text-white font-medium shadow-sm shadow-emerald-500/40"
                            : "text-slate-700 dark:text-slate-300 hover:bg-emerald-50/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span
                        className={`whitespace-nowrap transition-opacity ${
                          sidebarCollapsed ? "opacity-0" : "opacity-100"
                        }`}
                      >
                        {label}
                      </span>

                      {/* Tooltip when collapsed */}
                      {sidebarCollapsed && (
                        <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 rounded-md bg-slate-900 text-slate-50 border border-slate-700 px-2 py-1 text-[11px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          {label}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="h-3" />
        </div>
      </aside>

      {/* Mobile / Tablet slide-in sidebar */}
      <aside
        className={`lg:hidden fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md shadow-xl shadow-slate-900/20 dark:shadow-slate-900/70 transform transition-transform duration-300 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200/80 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Menu
            </span>
            <button
              onClick={closeMobileSidebar}
              className="inline-flex items-center justify-center rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/80 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
            {sections.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="px-3 text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                        ${
                          isActive
                            ? "bg-emerald-500 text-white font-medium shadow-sm shadow-emerald-500/40"
                            : "text-slate-700 dark:text-slate-300 hover:bg-emerald-50/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                        }`
                      }
                      onClick={closeMobileSidebar}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Main content – margin responds to sidebar width */}
      <main
        className={`flex-1 min-h-screen pt-16 overflow-y-auto px-3 sm:px-5 xl:px-8 transition-[margin] duration-300 ${sidebarMarginClass}`}
      >
        <Outlet context={{ sidebarCollapsed, sidebarBaseWidth }} />
      </main>
    </div>
  );
}

export default AdminLayout;
