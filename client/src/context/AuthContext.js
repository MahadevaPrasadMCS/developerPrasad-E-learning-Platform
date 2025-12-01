// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullScreenLoader from "../components/FullScreenLoader";
import { ROLES } from "../config/roles";
import api from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const redirectByRole = (role) => {
    const routes = {
      [ROLES.CEO]: "/ceo",
      [ROLES.ADMIN]: "/admin",
      [ROLES.INSTRUCTOR]: "/instructor",
      [ROLES.MODERATOR]: "/moderator",
      [ROLES.STUDENT]: "/dashboard",
    };
    navigate(routes[role] || "/", { replace: true });
  };

  // Load from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem("auth_data");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.token);
        redirectByRole(parsed.user.role);
      } catch {
        localStorage.removeItem("auth_data");
      }
    }
    setLoading(false);
  }, []);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "auth_data") {
        const data = e.newValue ? JSON.parse(e.newValue) : null;
        setUser(data?.user || null);
        setToken(data?.token || null);
        if (!data) navigate("/login");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [navigate]);

  const persistAuth = (nextUser, nextToken) => {
    const auth = { user: nextUser, token: nextToken };
    localStorage.setItem("auth_data", JSON.stringify(auth));
    setUser(nextUser);
    setToken(nextToken);
  };

  const login = ({ user, token }) => {
    persistAuth(user, token);
    redirectByRole(user.role);
  };

  const logout = () => {
    localStorage.removeItem("auth_data");
    setUser(null);
    setToken(null);
    navigate("/login", { replace: true });
  };

  // 🔄 Pull fresh profile from /auth/me
  const updateUserFromServer = async () => {
    try {
      const res = await api.get("/auth/me");
      const updatedUser = { ...(user || {}), ...res.data };
      persistAuth(updatedUser, token);
    } catch (err) {
      console.error("Failed to refresh user from server:", err);
      // if unauthorized, force logout
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    }
  };

  const handleAuthError = (status) => {
    if (status === 401 || status === 403) logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        handleAuthError,
        loading,
        updateUserFromServer,
      }}
    >
      {loading ? <FullScreenLoader /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
