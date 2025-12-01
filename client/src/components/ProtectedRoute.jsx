// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FullScreenLoader from "./FullScreenLoader";
import { ROLES } from "../config/roles";

function ProtectedRoute({ element, allowRoles = [] }) {
  const { user, token, loading } = useAuth();

  if (loading) return <FullScreenLoader message="Authenticating..." />;

  if (!token || !user) return <Navigate to="/login" replace />;

  if (allowRoles.length > 0 && !allowRoles.includes(user.role)) {
    const fallbackRoutes = {
      [ROLES.CEO]: "/ceo",
      [ROLES.ADMIN]: "/admin",
      [ROLES.INSTRUCTOR]: "/instructor",
      [ROLES.MODERATOR]: "/moderator",
      [ROLES.STUDENT]: "/dashboard",
    };
    return <Navigate to={fallbackRoutes[user.role] || "/"} replace />;
  }

  return element;
}

export default ProtectedRoute;
