import axios from "axios";

// Create a clean base URL without duplicate /api/v1 prefixes
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

// Only add /api/v1 once
const API_URL = `${BASE_URL}/api/v1`;

// Create axios instance with base URL
const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies
});

// Check token expiration and validity
const checkTokenValidity = () => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    console.log("No token found");
    return false;
  }
  
  try {
    // Decode the token to get the expiration time
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    
    // Check if token is expired
    if (Date.now() > expiryTime) {
      console.warn("⚠️ Token has expired");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error decoding token:", error);
    return false;
  }
};

// Add auth token to requests
API.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token");
  
  if (token) {
    // Check if token is valid
    if (checkTokenValidity()) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Try to refresh the token if available
      try {
        console.log("Attempting to refresh token...");
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
          withCredentials: true
        });
        
        if (response.data && response.data.accessToken) {
          localStorage.setItem("token", response.data.accessToken);
          config.headers.Authorization = `Bearer ${response.data.accessToken}`;
          console.log("✅ Token refreshed successfully");
        } else {
          // Handle failed refresh by removing invalid token
          localStorage.removeItem("token");
          console.warn("⚠️ Token refresh failed, user will need to login again");
          
          // Only redirect if on a protected page
          if (!window.location.pathname.includes('/login') && 
              !window.location.pathname.includes('/register')) {
            window.location.href = "/login";
          }
        }
      } catch (error) {
        console.error("Token refresh error:", error);
        localStorage.removeItem("token");
        
        // Only redirect if on a protected page
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          window.location.href = "/login";
        }
      }
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Debug interceptor
API.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Improved response interceptor
API.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ Error: ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      
      // Handle authentication errors
      if (error.response.status === 401 || error.response.status === 403) {
        console.warn("Authentication error:", error.response.data?.message || "Unauthorized access");
        
        // Remove invalid token
        localStorage.removeItem("token");
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          window.location.href = "/login";
        }
      }
    } else {
      console.error(`❌ Request failed:`, error.message);
    }
    
    return Promise.reject(error);
  }
);

export default API;
