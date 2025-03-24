import { createContext, useState, useEffect, useContext } from "react";
import { getUserProfile } from "../services/authService";
import PropTypes from "prop-types";
import { connectSocket } from "../context/SocketContext";
import API from "../services/api";

// Create context with default values
export const AuthContext = createContext({
  userData: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  refreshAuthStatus: () => {}
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  // Function to refresh auth state
  const refreshAuthStatus = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      console.log("Refreshing authentication status...");
      
      // Check for token
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.log("No token found, marking as not authenticated");
        setIsAuthenticated(false);
        setUserData(null);
        return;
      }
      
      try {
        // Check token validity
        const payload = token.split('.')[1];
        if (!payload) throw new Error("Invalid token format");
        
        const decodedPayload = JSON.parse(atob(payload));
        const expiryTime = decodedPayload.exp * 1000;
        
        if (Date.now() > expiryTime) {
          console.warn("Token has expired, attempting refresh");
          
          try {
            // Try to refresh the token
            const refreshResponse = await API.post("/auth/refresh-token", {});
            
            if (refreshResponse.data && refreshResponse.data.accessToken) {
              // Update token in localStorage
              localStorage.setItem("token", refreshResponse.data.accessToken);
              API.defaults.headers.common["Authorization"] = `Bearer ${refreshResponse.data.accessToken}`;
              console.log("Token refreshed successfully");
            } else {
              throw new Error("Token refresh failed");
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            localStorage.removeItem("token");
            setIsAuthenticated(false);
            setUserData(null);
            return;
          }
        }
        
        // Set token in API headers
        API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        // Try to get user data
        const response = await getUserProfile();
        
        if (response && response._id) {
          console.log("Successfully authenticated user:", response.name);
          setUserData(response);
          setIsAuthenticated(true);
          localStorage.setItem("userData", JSON.stringify(response));
          
          // Connect socket if needed
          try {
            connectSocket();
          } catch (socketErr) {
            console.error("Non-critical socket error:", socketErr);
          }
        } else {
          console.warn("Invalid user data response");
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
          setIsAuthenticated(false);
          setUserData(null);
        }
      } catch (err) {
        console.error("Error during auth refresh:", err);
        
        setAuthError("Authentication failed: " + (err.message || "Unknown error"));
        
        // Only log out for 401 errors or token-related errors
        if (err.response?.status === 401 || 
            err.message.includes("token") || 
            err.message.includes("expired")) {
          console.log("Authentication error, clearing auth state");
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
          setIsAuthenticated(false);
          setUserData(null);
        }
      }
    } catch (error) {
      console.error("Critical auth refresh error:", error);
      setAuthError("Critical authentication error");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize auth state on component mount
  useEffect(() => {
    console.log("AuthProvider mounted, refreshing status");
    refreshAuthStatus();
    
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        refreshAuthStatus();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Login function
  const login = async (token, userDataObj) => {
    if (!token || !userDataObj) {
      console.error("Missing required login data");
      return false;
    }
    
    try {
      // Store authentication data
      localStorage.setItem("token", token);
      localStorage.setItem("userData", JSON.stringify(userDataObj));
      
      // Update state
      setUserData(userDataObj);
      setIsAuthenticated(true);
      setAuthError(null);
      
      // Set auth header for API requests
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      // Connect socket
      try {
        connectSocket();
      } catch (socketErr) {
        console.error("Socket connection error:", socketErr);
      }
      
      return true;
    } catch (error) {
      console.error("Login function error:", error);
      setAuthError("Login failed: " + (error.message || "Unknown error"));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Clear storage
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      
      // Update state
      setUserData(null);
      setIsAuthenticated(false);
      setAuthError(null);
      
      // Remove auth header
      delete API.defaults.headers.common["Authorization"];
      
      // Disconnect socket if needed
      
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    userData,
    isLoading,
    isAuthenticated,
    authError,
    login,
    logout,
    refreshAuthStatus
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

