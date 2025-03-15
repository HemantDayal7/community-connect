import { createContext, useState, useEffect, useContext } from "react";
import { getUserProfile } from "../services/authService";
import PropTypes from "prop-types";
import socket, { connectSocket } from "../services/socket";
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
  
  // Function to refresh auth state
  const refreshAuthStatus = async () => {
    try {
      setIsLoading(true);
      console.log("Refreshing authentication status...");
      
      // Check for token
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.log("No token found, marking as not authenticated");
        setIsAuthenticated(false);
        setUserData(null);
        return;
      }
      
      // Try to get user data
      try {
        // Set token in API headers
        API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const response = await getUserProfile();
        
        if (response && response._id) {
          console.log("Successfully authenticated user:", response.name);
          setUserData(response);
          setIsAuthenticated(true);
          localStorage.setItem("userData", JSON.stringify(response));
          
          // Connect socket if needed
          try {
            if (socket && !socket.connected) {
              connectSocket();
              console.log("Socket connected after auth refresh");
            }
          } catch (socketErr) {
            console.error("Non-critical socket error:", socketErr);
            // Don't fail auth just because socket fails
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
        
        // Only log out for 401 errors
        if (err.response && err.response.status === 401) {
          console.log("Received 401, clearing auth state");
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
          setIsAuthenticated(false);
          setUserData(null);
        }
      }
    } catch (error) {
      console.error("Critical auth refresh error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh auth status on component mount
  useEffect(() => {
    console.log("AuthProvider mounted, refreshing status");
    let mounted = true;
    
    const initAuth = async () => {
      await refreshAuthStatus();
      if (!mounted) return;
    };
    
    initAuth();
    
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        refreshAuthStatus();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      mounted = false;
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Login function
  const login = async (token, userData) => {
    if (!token || !userData) {
      console.error("Missing required login data");
      return false;
    }
    
    try {
      // Store authentication data
      localStorage.setItem("token", token);
      localStorage.setItem("userData", JSON.stringify(userData));
      
      // Update state
      setUserData(userData);
      setIsAuthenticated(true);
      
      // Set auth header for API requests
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      // Connect socket
      try {
        if (socket && !socket.connected) {
          connectSocket();
          console.log("Socket connected after login");
        }
      } catch (socketErr) {
        console.error("Socket connection error:", socketErr);
        // Don't fail login if socket fails
      }
      
      return true;
    } catch (error) {
      console.error("Login function error:", error);
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
      
      // Remove auth header
      delete API.defaults.headers.common["Authorization"];
      
      // Disconnect socket
      try {
        if (socket && socket.connected) {
          socket.disconnect();
          console.log("Socket disconnected after logout");
        }
      } catch (socketErr) {
        console.error("Error disconnecting socket:", socketErr);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    userData,
    isLoading,
    isAuthenticated,
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

