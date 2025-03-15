import API from "./api";

// Register User
export const registerUser = async (userData) => {
  try {
    const response = await API.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Registration failed";
  }
};

// Login User
export const loginUser = async (credentials) => {
  try {
    console.log("Making login request to /auth/login");
    const response = await API.post("/auth/login", credentials);
    console.log("Login response:", response.data);
    
    const { accessToken, _id, name, email } = response.data;
    
    // Store token for immediate use
    if (accessToken) {
      API.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      
      // Return user data and token
      return {
        accessToken,
        user: { _id, name, email }
      };
    }
    
    throw new Error("No access token received");
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error.response?.data?.message || "Login failed. Check your credentials.";
  }
};

// Logout User
export const logoutUser = async () => {
  try {
    await API.post("/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
    // Continue with client-side logout even if server logout fails
  } finally {
    // Always clear local storage
    localStorage.removeItem("token");
  }
};

// Get User Profile
export const getUserProfile = async () => {
  try {
    // Debug
    console.log("Getting user profile with token:", !!localStorage.getItem("token"));
    
    // Make sure headers have the token
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token available");
    }
    
    // Set Authorization header explicitly for this request (backup)
    const response = await API.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log("User profile response:", response.status);
    return response.data;
  } catch (error) {
    console.error("getUserProfile error:", error.message);
    
    // Don't throw error for network issues
    if (error.message.includes("Network Error") || !error.response) {
      console.log("Network error in getUserProfile, returning cached user data");
      
      // Return cached user data from localStorage instead of failing
      const userData = localStorage.getItem("userData");
      if (userData) {
        return JSON.parse(userData);
      }
    }
    
    throw error;
  }
};

// Update User Profile
export const updateUserProfile = async (userData) => {
  try {
    const response = await API.put("/auth/profile", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to update profile";
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
