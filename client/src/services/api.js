import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5050/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important! This ensures cookies are sent with requests
});

// Attach token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized errors
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const response = await axios.post(
          "http://localhost:5050/api/v1/auth/refresh-token",
          {},
          { withCredentials: true }
        );
        
        if (response.data.accessToken) {
          // Store new token
          localStorage.setItem("token", response.data.accessToken);
          
          // Update header and retry
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Log the error for debugging
        console.error('Token refresh failed:', refreshError);
        
        // If refresh fails, redirect to login
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;
