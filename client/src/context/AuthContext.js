// client/src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load auth data on mount
  useEffect(() => {
    const stored = localStorage.getItem("auth_data");
    if (stored) {
      try {
        const { user, token } = JSON.parse(stored);
        setUser(user);
        setToken(token);
      } catch {
        localStorage.removeItem("auth_data");
      }
    }
    setLoading(false);
  }, []);

  // 🔹 Listen for login/logout from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "auth_data") {
        const newAuth = e.newValue ? JSON.parse(e.newValue) : null;
        if (!newAuth) {
          // Logged out elsewhere
          setUser(null);
          setToken(null);
          window.location.href = "/login";
        } else if (newAuth.token !== token) {
          // Logged in elsewhere
          setUser(newAuth.user);
          setToken(newAuth.token);
          window.location.reload();
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [token]);

  // 🔹 Login Function
  const login = ({ user, token }) => {
    const data = { user, token };
    localStorage.setItem("auth_data", JSON.stringify(data));
    setUser(user);
    setToken(token);
  };

  // 🔹 Logout Function
  const logout = (reason) => {
    localStorage.removeItem("auth_data");
    setUser(null);
    setToken(null);
    if (reason) alert(reason);
    window.location.href = "/login";
  };

  // 🔹 Global session monitor (handles blocked or forced logout)
  const handleAuthError = (status, message) => {
    if (status === 403) {
      if (message?.includes("blocked"))
        logout("🚫 Your account has been blocked by admin.");
      else if (message?.includes("Session expired"))
        logout("⚠️ Your session expired. Please log in again.");
      else logout("⚠️ Access denied. Please log in again.");
    } else if (status === 503 && message?.includes("maintenance")) {
      alert("🛠️ Site is under maintenance. Try again later.");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, setUser, handleAuthError, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
