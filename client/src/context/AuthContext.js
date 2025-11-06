// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Detect which role is active based on the route prefix
  const roleKey = window.location.pathname.startsWith("/admin")
    ? "admin"
    : "user";

  // Load role-specific data
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem(`${roleKey}_user`)) || null
  );
  const [token, setToken] = useState(localStorage.getItem(`${roleKey}_token`) || "");

  // Keep token synced
  useEffect(() => {
    if (token) {
      localStorage.setItem(`${roleKey}_token`, token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem(`${roleKey}_token`);
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token, roleKey]);

  // Keep user synced
  useEffect(() => {
    if (user) localStorage.setItem(`${roleKey}_user`, JSON.stringify(user));
    else localStorage.removeItem(`${roleKey}_user`);
  }, [user, roleKey]);

  // ✅ Register new user
  const register = async (name, email, password) => {
    await api.post("/auth/register", { name, email, password });
  };

  // ✅ Login handler (role-based)
  const login = (userData, authToken) => {
    const currentRole = userData.role === "admin" ? "admin" : "user";
    setUser(userData);
    setToken(authToken);
    localStorage.setItem(`${currentRole}_user`, JSON.stringify(userData));
    localStorage.setItem(`${currentRole}_token`, authToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
  };

  // ✅ Logout clears only current role data
  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem(`${roleKey}_token`);
    localStorage.removeItem(`${roleKey}_user`);
    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, token, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
