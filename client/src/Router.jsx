import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ErrorBoundary from './components/ErrorBoundary';
import { useSocket } from './context/SocketContext';

// Layout
import MainLayout from "./components/layout/MainLayout";

// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Resources from "./pages/Resources";
import Events from "./pages/Events";
import SkillSharing from "./pages/SkillSharing";
import HelpRequests from "./pages/HelpRequests";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import SkillRequests from "./pages/SkillRequests";

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  
  console.log("ProtectedRoute check:", { isAuthenticated, isLoading });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#69C143]"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

// Main App Router Component
export default function AppRouter() {
  console.log("Rendering AppRouter component");
  
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

// Main Routing Component
function AppRoutes() {
  const { userData, isAuthenticated } = useContext(AuthContext);
  const { socket } = useSocket(); // Use the socket context
  
  // Socket connection and notification management
  useEffect(() => {
    console.log("AppRoutes effect running, auth status:", isAuthenticated);
    let mounted = true;
    
    // Only setup socket if authenticated and we have a user ID
    if (isAuthenticated && userData?._id) {
      try {
        console.log("Setting up socket with user:", userData._id);
        
        // Setup socket event listeners
        const handleConnect = () => {
          if (!mounted) return;
          
          console.log("Socket connected with ID:", socket.id);
          
          // Identify user to server
          try {
            socket.emit("authenticate", userData._id);
            socket.emit("userOnline", userData._id);
          } catch (emitError) {
            console.error("Error sending socket auth events:", emitError);
          }
        };
        
        const handleConnectError = (err) => {
          if (!mounted) return;
          
          console.error("Socket connection error:", err.message);
          // Use toastId to prevent duplicate toasts
          toast.error("Connection issue: Some features may be limited", {
            toastId: "socket-error"
          });
        };
        
        const handleNotification = (notification) => {
          if (!mounted) return;
          
          console.log("Received notification:", notification);
          toast.info(notification.message, {
            position: "top-right",
            autoClose: 5000
          });
        };
        
        const handleMessage = (message) => {
          if (!mounted || !message) return;
          
          // Only show notification if it's from another user
          if (message.senderId !== userData._id) {
            const senderName = message.senderId?.name || "Someone";
            toast.info(`New message from ${senderName}`, {
              position: "top-right",
              autoClose: 4000
            });
          }
        };
        
        // Remove existing listeners before adding new ones
        socket.off("connect");
        socket.off("connect_error");
        socket.off("notification");
        socket.off("message");
        
        // Add listeners
        socket.on("connect", handleConnect);
        socket.on("connect_error", handleConnectError);
        socket.on("notification", handleNotification);
        socket.on("message", handleMessage);
        
        // If already connected, emit auth events
        if (socket.connected) {
          handleConnect();
        }
      } catch (error) {
        console.error("Socket setup error:", error);
      }
      
      return () => {
        mounted = false;
        
        // Clean up listeners
        try {
          socket.off("connect");
          socket.off("connect_error");
          socket.off("notification");
          socket.off("message");
        } catch (error) {
          console.error("Error removing socket listeners:", error);
        }
      };
    }
  }, [isAuthenticated, userData]);

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/home" replace />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/home" replace />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout userData={userData}><Home /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/home" element={
          <ProtectedRoute>
            <MainLayout userData={userData}><Home /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout userData={userData}><Profile /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout userData={userData}><Dashboard /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/resources" element={
          <ProtectedRoute>
            <MainLayout userData={userData}><Resources /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/events" element={
          <ProtectedRoute>
            <MainLayout userData={userData}><Events /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/skills" element={
          <ProtectedRoute>
            <MainLayout userData={userData}><SkillSharing /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/help" element={
          <ProtectedRoute>
            <MainLayout userData={userData}><HelpRequests /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/messages" element={
          <ProtectedRoute>
            <MainLayout userData={userData}><Messages /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/skill-requests" element={
          <ProtectedRoute>
            <SkillRequests />
          </ProtectedRoute>
        } />
        
        <Route path="/skillsharing" element={
          <ProtectedRoute>
            <MainLayout userData={userData}><SkillSharing /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <ToastContainer />
    </>
  );
}