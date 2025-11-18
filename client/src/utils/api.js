import axios from "axios";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

const backendURL =
  process.env.REACT_APP_API_URL ||
  "https://youlearnhub-backend.onrender.com/api"; // 🔥 /api added here

const api = axios.create({
  baseURL: backendURL,
  headers: { "Content-Type": "application/json" },
});

NProgress.configure({ showSpinner: false, trickleSpeed: 150, minimum: 0.15 });

api.interceptors.request.use(
  (config) => {
    if (!NProgress.isStarted()) NProgress.start();

    const storedAuth = localStorage.getItem("auth_data");
    if (storedAuth) {
      try {
        const { token } = JSON.parse(storedAuth);
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        localStorage.removeItem("auth_data");
      }
    }

    return config;
  },
  (error) => {
    NProgress.done();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    NProgress.done();
    return response;
  },
  (error) => {
    NProgress.done();

    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("auth_data");
      if (!window.location.pathname.includes("/login")) {
        setTimeout(() => {
          window.location.href = "/login";
        }, 400);
      }
    }

    if (status >= 500) {
      console.error("Server Error:", error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default api;
