// client/src/api.js
import axios from "axios";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// Create API instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Configure NProgress
NProgress.configure({ showSpinner: false, trickleSpeed: 180 });

// Request interceptor
api.interceptors.request.use(
  (config) => {
    NProgress.start();
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    NProgress.done();
    return Promise.reject(error);
  }
);

// Response interceptor
// src/utils/api.js
api.interceptors.request.use(
  (config) => {
    NProgress.start();

    const isAdmin = window.location.pathname.startsWith("/admin");
    const token = localStorage.getItem(isAdmin ? "admin_token" : "user_token");

    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    NProgress.done();
    return Promise.reject(error);
  }
);


export default api;
