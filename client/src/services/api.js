import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5050/api/v1", // ✅ FIXED: Ensure only one "api/v1"
});

// Attach JWT token if present
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
