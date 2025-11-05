import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Quiz from "./pages/Quiz";
import Wallet from "./pages/Wallet";
import Community from "./pages/Community";
import Announcements from "./pages/Announcements";
import Store from "./pages/Store";
import Leaderboard from "./pages/Leaderboard";
import ManageStore from "./pages/admin/ManageStore";
import ManageQuiz from "./pages/admin/ManageQuiz";
import UsersPage from "./pages/admin/UsersPage";
import Rewards from "./pages/admin/Rewards";
import Tutorials from "./pages/Tutorials";
import "./App.css"
import "./index.css";
import { Sun, Moon } from "lucide-react";

function ProtectedRoute({ element }) {
  const { token } = useAuth();
  return token ? (
    element
  ) : (
    <p className="text-center mt-10 text-gray-500">Login first!</p>
  );
}

/* 🌐 Responsive & Elegant Navbar */
function Navbar() {
  const { token, user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavItem = ({ to, label }) => (
    <NavLink
      to={to}
      onClick={() => setMenuOpen(false)}
      className={({ isActive }) =>
        `px-4 py-2 text-sm font-medium transition-colors duration-200 ${
          isActive
            ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500"
            : "text-gray-700 dark:text-gray-200 hover:text-teal-500"
        }`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-lg shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* 🌀 LOGO */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <img
            src={require("./assets/logo.png")}
            alt="Logo"
            className="h-9 w-9 rounded-full shadow-sm hover:scale-105 transition-transform duration-200"
          />
          <h1 className="text-xl font-semibold text-teal-600 dark:text-teal-400 tracking-wide hover:opacity-90">
            YouLearnHub
          </h1>
        </div>

        {/* 🌈 DESKTOP MENU */}
        <ul className="hidden md:flex items-center gap-4 text-gray-700 dark:text-gray-200 font-medium">
          {!token && (
            <>
              <NavItem to="/" label="Home" />
              <NavItem to="/register" label="Register" />
              <NavItem to="/login" label="Login" />
            </>
          )}

          {token && user?.role === "user" && (
            <>
              <NavItem to="/" label="Home" />
              <NavItem to="/dashboard" label="Dashboard" />
              <NavItem to="/tutorials" label="Tutorials" />
              <NavItem to="/learn" label="Learn" />
              <NavItem to="/quiz" label="Quiz" />
              <NavItem to="/wallet" label="Wallet" />
              <NavItem to="/community" label="Community" />
              <NavItem to="/leaderboard" label="Leaderboard" />
              <NavItem to="/store" label="Store" />
              <NavItem to="/announcements" label="Announcements" />
            </>
          )}

          {token && user?.role === "admin" && (
            <>
              <NavItem to="/" label="Home" />
              <NavItem to="/admin/manage-quiz" label="Manage Quiz" />
              <NavItem to="/admin/upload-resource" label="Upload Resource" />
              <NavItem to="/admin/announcements" label="Announcements" />
              <NavItem to="/admin/users" label="Users" />
              <NavItem to="/admin/rewards" label="Rewards" />
            </>
          )}

          {/* ☀️ DARK MODE TOGGLE */}
          <button
            onClick={toggleTheme}
            title={darkMode ? "Light Mode" : "Dark Mode"}
            className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* 🚪 LOGOUT */}
          {token && (
            <button
              onClick={handleLogout}
              className="ml-2 bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-md text-sm shadow-md transition-transform duration-200 hover:scale-105"
            >
              Logout
            </button>
          )}
        </ul>

        {/* 📱 MOBILE MENU BUTTON */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* 📲 MOBILE DROPDOWN */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3 space-y-2 animate-fade-in">
          {!token && (
            <>
              <NavItem to="/" label="Home" />
              <NavItem to="/register" label="Register" />
              <NavItem to="/login" label="Login" />
            </>
          )}

          {token && user?.role === "user" && (
            <>
              <NavItem to="/" label="Home" />
              <NavItem to="/dashboard" label="Dashboard" />
              <NavItem to="/tutorials" label="Tutorials" />
              <NavItem to="/learn" label="Learn" />
              <NavItem to="/quiz" label="Quiz" />
              <NavItem to="/wallet" label="Wallet" />
              <NavItem to="/leaderboard" label="Leaderboard" />
              <NavItem to="/community" label="Community" />
              <NavItem to="/store" label="Store" />
              <NavItem to="/announcements" label="Announcements" />
            </>
          )}

          {token && user?.role === "admin" && (
            <>
              <NavItem to="/" label="Home" />
              <NavItem to="/admin/manage-quiz" label="Manage Quiz" />
              <NavItem to="/admin/upload-resource" label="Upload Resource" />
              <NavItem to="/admin/announcements" label="Announcements" />
              <NavItem to="/admin/users" label="Users" />
              <NavItem to="/admin/rewards" label="Rewards" />
            </>
          )}

          {token && (
            <button
              onClick={handleLogout}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-md text-sm transition-colors duration-200"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

/* 🧭 APP WRAPPER */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Navbar />

          <main className="min-h-[80vh] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 p-4 md:p-6">
            <Routes>
              {/* 🧩 Guest + Shared */}
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/announcements" element={<Announcements />} />

              {/* 👨‍🎓 User Routes */}
              <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
              <Route path="/tutorials" element={<ProtectedRoute element={<Tutorials />} />} />
              <Route path="/learn" element={<ProtectedRoute element={<Learn />} />} />
              <Route path="/quiz" element={<ProtectedRoute element={<Quiz />} />} />
              <Route path="/wallet" element={<ProtectedRoute element={<Wallet />} />} />
              <Route path="/leaderboard" element={<ProtectedRoute element={<Leaderboard />} />} />
              <Route path="/community" element={<ProtectedRoute element={<Community />} />} />
              <Route path="/store" element={<ProtectedRoute element={<Store />} />} />

              {/* 👑 Admin Routes */}
              <Route path="/admin/manage-quiz" element={<ProtectedRoute element={<ManageQuiz />} />} />
              <Route path="/admin/upload-resource" element={<ProtectedRoute element={<ManageStore />} />} />
              <Route path="/admin/announcements" element={<ProtectedRoute element={<Announcements />} />} />
              <Route path="/admin/users" element={<ProtectedRoute element={<UsersPage />} />} />
              <Route path="/admin/rewards" element={<ProtectedRoute element={<Rewards />} />} />
            </Routes>
          </main>

          <footer className="text-center py-5 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 mt-8 border-t border-gray-200 dark:border-gray-700">
            © {new Date().getFullYear()}{" "}
            <span className="text-teal-600 font-semibold">YouLearnHub</span> — built by{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-100">dp</span>
          </footer>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
