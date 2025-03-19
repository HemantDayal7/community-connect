import axios from "axios";

// Create a clean base URL without duplicate /api/v1 prefixes
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

// Only add /api/v1 once
const API_URL = `${BASE_URL}/api/v1`;

// Create axios instance with base URL
const API = axios.create({
  baseURL: API_URL, // Already includes /api/v1
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies
});

// Check these lines to ensure proper configuration

// Make sure baseURL is set correctly
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5050/api/v1";

// Check how authorization headers are being set
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add this to your interceptor if you don't already have it

// Debug interceptor
axios.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    return Promise.reject(error);
  }
);

// Add interceptors as needed

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Update interceptors to handle more status codes as success
API.interceptors.response.use(
  (response) => {
    // Log success responses
    console.log(`✅ ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Don't treat 304 Not Modified as an error
    if (error.response && error.response.status === 304) {
      console.log(`ℹ️ 304 Not Modified: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      return Promise.resolve({ data: error.response.data, status: 304 });
    }
    
    // Log error responses
    console.error(`❌ Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    return Promise.reject(error);
  }
);

export default API;
