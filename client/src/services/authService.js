import API from "./api";

// Register User
export const registerUser = async (userData) => {
  try {
    const response = await API.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Registration failed";
  }
};

// Login User
export const loginUser = async (credentials) => {
  try {
    const response = await API.post("/auth/login", credentials);
    const { accessToken } = response.data;
    
    // Also fetch user data for immediate use
    if (accessToken) {
      // Set token temporarily for the next request
      API.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      const userResponse = await API.get("/auth/me");
      
      // Return both token and user data
      return {
        accessToken,
        user: userResponse.data
      };
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || "Login failed";
  }
};

// Logout User
export const logoutUser = async () => {
  try {
    // Call backend logout endpoint if you have one (to invalidate token on server)
    await API.post("/auth/logout");
  } catch (error) {
    console.error("Backend logout failed:", error);
    // Continue with local logout even if backend logout fails
  } finally {
    // Always clear local storage
    localStorage.removeItem("token");
  }
};

// Get Authenticated User Profile
export const getUserProfile = async () => {
  try {
    const response = await API.get("/auth/me");
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Try to refresh the token
      try {
        const refreshResponse = await API.post("/auth/refresh-token");
        if (refreshResponse.data.accessToken) {
          // Save new token and retry original request
          localStorage.setItem("token", refreshResponse.data.accessToken);
          return await getUserProfile();
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // If refresh fails, logout
        logoutUser();
      }
    }
    throw error.response?.data || "Failed to fetch profile";
  }
};

// Refresh Token
export const refreshToken = async () => {
  try {
    const response = await API.post("/auth/refresh-token");
    if (response.data.accessToken) {
      localStorage.setItem("token", response.data.accessToken);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
};

// Add this function to your authService.js

export const validateToken = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return false;
    
    // Try to use the token to get user data
    const response = await API.get("/auth/me");
    return !!response.data; // Convert to boolean
  } catch (error) {
    console.error("Token validation failed:", error);
    localStorage.removeItem("token"); // Clear invalid token
    return false;
  }
};
