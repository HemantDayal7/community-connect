import { createContext, useState, useEffect, useContext } from "react";
import { getUserProfile } from "../services/authService";
import PropTypes from "prop-types";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Function to refresh auth state
  const refreshAuthStatus = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        setUserData(null);
        return;
      }

      const user = await getUserProfile();
      if (user) {
        setUserData(user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUserData(null);
      }
    } catch (error) {
      console.error("Auth verification failed:", error);
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup auth state on mount and listen for token changes
  useEffect(() => {
    refreshAuthStatus();

    // Create storage event listener to sync state across tabs
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        refreshAuthStatus();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", refreshAuthStatus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", refreshAuthStatus);
    };
  }, []);

  // Login function that updates state
  const login = async (token, user) => {
    localStorage.setItem("token", token);
    setUserData(user);
    setIsAuthenticated(true);
    window.dispatchEvent(new Event("auth-change"));
  };

  // Logout function that updates state
  const logout = () => {
    localStorage.removeItem("token");
    setUserData(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("auth-change"));
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