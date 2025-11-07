import axios from "axios";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// 🌍 Backend baseURL — auto adapts for dev/production
const api = axios.create({
  baseURL:
    window.location.hostname === "localhost"
      ? "http://localhost:5000/api"
      : "https://youlearnhub-backend.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

// ⚙️ NProgress Config
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 150,
  minimum: 0.15,
});

// 🔹 Request Interceptor
api.interceptors.request.use(
  (config) => {
    // start loading bar
    if (!NProgress.isStarted()) NProgress.start();

    // attach token
    const storedAuth = localStorage.getItem("auth_data");
    if (storedAuth) {
      try {
        const { token } = JSON.parse(storedAuth);
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        console.warn("⚠️ Corrupted auth data in localStorage.");
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

// 🔹 Response Interceptor
api.interceptors.response.use(
  (response) => {
    NProgress.done();
    return response;
  },
  (error) => {
    NProgress.done();

    const status = error.response?.status;

    // 🧭 Handle API unreachable (network or CORS)
    if (!status) {
      console.error("🌐 Network error: Backend unreachable or offline");
      alert(
        "⚠️ Unable to reach server. Please check your connection or try again later."
      );
      return Promise.reject(error);
    }

    // 🔒 Handle Unauthorized or Expired JWT
    if (status === 401) {
      console.warn("🔑 Session expired. Redirecting to login...");

      localStorage.removeItem("auth_data");
      window.dispatchEvent(new StorageEvent("storage", { key: "auth_data" }));

      // Prevent redirect loop
      if (!window.location.pathname.includes("/login")) {
        setTimeout(() => (window.location.href = "/login"), 500);
      }
    }

    // 🔒 Forbidden route
    if (status === 403) {
      alert("🚫 Access denied. You don’t have permission for this action.");
    }

    // 🧩 Log other backend issues
    if (status >= 500) {
      console.error("💥 Server Error:", error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;
