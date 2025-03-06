import React from "react";
import { Routes, Route } from "react-router-dom";
// Adjust these imports to match your actual file locations
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Resources from "../pages/Resources";
import Events from "../pages/Events";
import Messages from "../pages/Messages";
import SkillSharing from "../pages/skills/SkillSharing";
import HelpRequests from "../pages/help/HelpRequests";
import NotFound from "../pages/NotFound";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/events" element={<Events />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/skills" element={<SkillSharing />} />
      <Route path="/help" element={<HelpRequests />} />
      {/* Catch-all for unknown paths */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
