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

// Add interceptors as needed

export default API;
