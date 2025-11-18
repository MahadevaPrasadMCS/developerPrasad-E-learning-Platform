import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

// Shared Pages
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Announcements from "./pages/Announcements";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import PrivatPolicy from "./pages/PrivacyPolicy";  
import TermsAndConditions from "./pages/TermsAndConditions";
import Login from "./pages/Login";
import Register from "./pages/Register";

// User Pages
import Dashboard from "./pages/Dashboard";
import Tutorials from "./pages/Tutorials";
import Learn from "./pages/Learn";
import Quiz from "./pages/Quiz";
import Wallet from "./pages/Wallet";
import Community from "./pages/Community";
import Store from "./pages/Store";
import Leaderboard from "./pages/Leaderboard";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminControlPanel from "./pages/admin/AdminControlPanel";
import AdminQuizAnalytics from "./pages/admin/AdminQuizAnalytics";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import ManageQuiz from "./pages/admin/ManageQuiz";
import ManageStore from "./pages/admin/ManageStore";
import UsersPage from "./pages/admin/UsersPage";
import ProfileRequests from "./pages/admin/ProfileRequests";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminUsers from "./pages/admin/AdminUsers";
import Rewards from "./pages/admin/Rewards";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* 🌍 Public + User Routes */}
            <Route element={<UserLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/support" element={<Support />} />
              <Route path="/privacy-policy" element={<PrivatPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />

              {/* Protected User Routes */}
              <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
              <Route path="/tutorials" element={<ProtectedRoute element={<Tutorials />} />} />
              <Route path="/learn" element={<ProtectedRoute element={<Learn />} />} />
              <Route path="/quiz" element={<ProtectedRoute element={<Quiz />} />} />
              <Route path="/wallet" element={<ProtectedRoute element={<Wallet />} />} />
              <Route path="/leaderboard" element={<ProtectedRoute element={<Leaderboard />} />} />
              <Route path="/community" element={<ProtectedRoute element={<Community />} />} />
              <Route path="/store" element={<ProtectedRoute element={<Store />} />} />
            </Route>

            {/* 👑 Admin Layout Routes */}
            <Route path="/admin" element={<ProtectedRoute element={<AdminLayout />} />}>
              {/* ✅ Default dashboard route */}
              <Route index element={<AdminDashboard />} />

              {/* Admin Tools */}
              <Route path="control-panel" element={<AdminControlPanel />} />
              <Route path="quiz-analytics" element={<AdminQuizAnalytics />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="manage-quiz" element={<ManageQuiz />} />
              <Route path="upload-resource" element={<ManageStore />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="profile-requests" element={<ProfileRequests />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="admin-users" element={<AdminUsers />} />
              <Route path="rewards" element={<Rewards />} />

              {/* Redirect fallback */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
