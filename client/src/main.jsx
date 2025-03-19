import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

// Routing
import AppRouter from "./Router";

// Notifications
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Debug log
console.log("Community Connect app starting...");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Authentication Context */}
    <AuthProvider>
      {/* Socket.IO Context */}
      <SocketProvider>
        {/* Main Router */}
        <AppRouter />
        
        {/* Global Toast Notifications */}
        <ToastContainer />
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
