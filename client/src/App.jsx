import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SystemSettingsProvider } from "./context/SystemSettingsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

import { ROLES } from "./config/roles";
import DemotionModal from "./components/DemotionModal";

// Layouts
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import CeoLayout from "./layouts/CeoLayout";
import InstructorLayout from "./layouts/InstructorLayout";
import ModeratorLayout from "./layouts/ModeratorLayout";
import PublicLayout from "./layouts/PublicLayout"; // 🆕

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

// Student Pages
import Dashboard from "./pages/Dashboard";
import Tutorials from "./pages/Tutorials";
import Learn from "./pages/Learn";
import Quiz from "./pages/Quiz";
import Wallet from "./pages/Wallet";
import Community from "./pages/Community";
import Store from "./pages/Store";
import Leaderboard from "./pages/Leaderboard";
import PromotionCenter from "./pages/promotions/PromotionCenter";

// CEO Pages
import CeoDashboard from "./pages/ceo/CeoDashboard";
import ManageRoles from "./pages/ceo/ManageRoles";
import RolePromotion from "./pages/ceo/RolePromotions";
import RoleDemotion from "./pages/ceo/DemotionRequests";
import Logs from "./pages/ceo/Logs";
import AnalyticsPage from "./pages/ceo/AnalyticsPage";
import WalletCEO from "./pages/ceo/WalletCEO";
import CeoProfile from "./pages/ceo/CeoProfile";
import SystemSettings from "./pages/ceo/SystemSettings";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogs from "./pages/admin/AdminLogs";
import AnnouncementsManager from "./pages/admin/AnnouncementsManager";
import CommunityModPanel from "./pages/admin/CommunityModPanel";
import ProfileRequests from "./pages/admin/ProfileRequests";
import PromotionRequests from "./pages/admin/PromotionRequests";
import QuizApproval from "./pages/admin/QuizApproval";
import ResourceApproval from "./pages/admin/ResourceApproval";
import UserManagement from "./pages/admin/UserManagement";

// Instructor Pages
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import CreateQuiz from "./pages/instructor/CreateQuiz";
import InstructorQuizzes from "./pages/instructor/InstructorQuizzes";
import InstructorResources from "./pages/instructor/InstructorResources";
import PromotionProgress from "./pages/instructor/PromotionProgress";
import QuizDrafts from "./pages/instructor/Quizdrafts";
import ResourceDrafts from "./pages/instructor/ResourceDrafts";
import UploadResource from "./pages/instructor/UploadResource";
import UploadVideo from "./pages/instructor/UploadVideo";

// Moderator Pages
import ModeratorDashboard from "./pages/moderator/ModeratorDashboard";
import CommunityModeration from "./pages/moderator/CommunityModeration";
import ReportedIssues from "./pages/moderator/ReportedIssues";
import AnnouncementsView from "./pages/moderator/AnnouncementsView";
import SuspiciousActivity from "./pages/moderator/SuspiciousActivity";

import api from "./utils/api";

// Wrapper to run demotion check after login
function AppWrapper() {
  const { isAuthenticated } = useAuth();
  const [demotionReq, setDemotionReq] = useState(null);

  const checkDemotion = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/role-change/mine");
      if (
        res?.data?._id &&
        ["PENDING_USER_REVIEW", "USER_DISPUTED", "USER_ACCEPTED"].includes(
          res.data.status
        )
      ) {
        setDemotionReq(res.data);
      } else {
        setDemotionReq(null);
      }
    } catch {
      setDemotionReq(null);
    }
  };

  useEffect(() => {
    checkDemotion();
  }, [isAuthenticated]);

  return (
    <>
      <Routes>
        {/* Public + marketing layout */}
        <Route element={<PublicLayout />}>
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
        </Route>

        {/* Student layout (only when logged in as STUDENT) */}
        <Route
          element={
            <ProtectedRoute
              allowRoles={[ROLES.STUDENT]}
              element={<UserLayout />}
            />
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tutorials" element={<Tutorials />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/community" element={<Community />} />
          <Route path="/store" element={<Store />} />
          <Route path="/promotion" element={<PromotionCenter />} />
        </Route>

        {/* CEO */}
        <Route
          path="/ceo"
          element={
            <ProtectedRoute allowRoles={[ROLES.CEO]} element={<CeoLayout />} />
          }
        >
          <Route index element={<CeoDashboard />} />
          <Route path="roles" element={<ManageRoles />} />
          <Route path="promotions" element={<RolePromotion />} />
          <Route path="demotions" element={<RoleDemotion />} />
          <Route path="logs" element={<Logs />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="wallet" element={<WalletCEO />} />
          <Route path="profile" element={<CeoProfile />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowRoles={[ROLES.ADMIN]} element={<AdminLayout />} />
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="profile-requests" element={<ProfileRequests />} />
          <Route path="promotion-requests" element={<PromotionRequests />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="quiz-approval" element={<QuizApproval />} />
          <Route path="resource-approval" element={<ResourceApproval />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="community-panel" element={<CommunityModPanel />} />
          <Route path="announcements" element={<AnnouncementsManager />} />
        </Route>

        {/* Instructor */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute
              allowRoles={[ROLES.INSTRUCTOR]}
              element={<InstructorLayout />}
            />
          }
        >
          <Route index element={<InstructorDashboard />} />
          <Route path="create-quiz" element={<CreateQuiz />} />
          <Route path="quizzes" element={<InstructorQuizzes />} />
          <Route path="quiz-drafts" element={<QuizDrafts />} />
          <Route path="resources" element={<InstructorResources />} />
          <Route path="resource-drafts" element={<ResourceDrafts />} />
          <Route path="upload-resource" element={<UploadResource />} />
          <Route path="upload-video" element={<UploadVideo />} />
          <Route path="promotion" element={<PromotionProgress />} />
        </Route>

        {/* Moderator */}
        <Route
          path="/moderator"
          element={
            <ProtectedRoute
              allowRoles={[ROLES.MODERATOR]}
              element={<ModeratorLayout />}
            />
          }
        >
          <Route index element={<ModeratorDashboard />} />
          <Route path="community" element={<CommunityModeration />} />
          <Route path="reports" element={<ReportedIssues />} />
          <Route path="announcements" element={<AnnouncementsView />} />
          <Route path="activity" element={<SuspiciousActivity />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {demotionReq && (
        <DemotionModal
          request={demotionReq}
          onUpdated={checkDemotion}
          onClose={() => setDemotionReq(null)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <SystemSettingsProvider>
            <AppWrapper />
          </SystemSettingsProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
