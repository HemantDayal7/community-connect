import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Layout from "./components/Layout";

function App() {
  return (
    <Routes>
      {/* Default to Login Page */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes - After Login */}
      <Route path="/home" element={<Layout><Home /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />

      {/* Catch-all route for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
