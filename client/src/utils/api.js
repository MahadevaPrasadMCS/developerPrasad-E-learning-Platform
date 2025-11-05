import axios from "axios";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

NProgress.configure({ showSpinner: false, trickleSpeed: 180 });

api.interceptors.request.use(
  (config) => {
    NProgress.start();
    return config;
  },
  (error) => {
    NProgress.done();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (res) => {
    NProgress.done();
    return res;
  },
  (error) => {
    NProgress.done();
    import("react-hot-toast").then(({ default: toast }) => {
      toast.error(error.response?.data?.message || "Something went wrong");
    });
    return Promise.reject(error);
  }
);

export default api;
