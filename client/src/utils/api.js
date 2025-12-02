// src/utils/api.js
import axios from "axios";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

const backendURL = "https://youlearnhub-backend.onrender.com/api";

const api = axios.create({
  baseURL: backendURL,
  headers: { "Content-Type": "application/json" },
});

// Start Loader
api.interceptors.request.use((config) => {
  if (!NProgress.isStarted()) NProgress.start();

  const stored = localStorage.getItem("auth_data");
  if (stored) {
    const { token } = JSON.parse(stored);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Stop loader + delegate error handling
api.interceptors.response.use(
  (res) => {
    NProgress.done();
    return res;
  },
  (err) => {
    NProgress.done();
    return Promise.reject(err);
  }
);

export default api;
