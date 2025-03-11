import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import PropTypes from "prop-types";
import { AuthProvider, AuthContext } from "./context/AuthContext";

// Import MainLayout component (Ensures consistent UI layout)
import MainLayout from './components/layout/MainLayout';

// Import pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Resources from "./pages/Resources";
import Events from "./pages/Events";
import Messages from "./pages/Messages";
import SkillSharing from "./pages/SkillSharing";
import HelpRequests from "./pages/HelpRequests";
import NotFound from "./pages/NotFound";

// ✅ Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#69C143]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

// ✅ Main Routing Component
function AppRoutes() {
  const { userData, isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#69C143]"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root path - redirect based on authentication status */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} 
      />
      
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/home" replace /> : <Register />} />
      
      {/* Protected Routes (Wrapped in MainLayout for Consistent UI) */}
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

      <Route path="/messages" element={
        <ProtectedRoute>
          <MainLayout userData={userData}><Messages /></MainLayout>
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

      {/* Catch-all route for 404 pages */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ✅ Final Exported Router Component
export default function AppRouter() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
