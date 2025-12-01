import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "./AuthContext";

const SystemSettingsContext = createContext();
export const useSystemSettings = () => useContext(SystemSettingsContext);

export const SystemSettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const res = await api.get("/system/settings");
      setSettings(res.data);
      document.title = res.data.platformName || "YouLearnHub";
    } catch (err) {
      console.error("System settings load failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  return (
    <SystemSettingsContext.Provider value={{ settings, setSettings, loading, reloadSettings: loadSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
};
