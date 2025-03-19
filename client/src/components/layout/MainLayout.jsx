// src/components/layout/MainLayout.jsx
import PropTypes from "prop-types";
import Sidebar from "../ui/Sidebar";
import Navbar from "../ui/Navbar";

export default function MainLayout({ children, userData }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Top navbar */}
      <Navbar userData={userData} />

      {/* Fixed sidebar on the left */}
      <Sidebar />

      {/* 
        Shift main content to the right on md+ screens (so it’s not behind the sidebar).
        On small screens, there's no left margin so the sidebar can slide over the page.
      */}
      <div className="pt-16 md:ml-64">
        {children}
      </div>
    </div>
  );
}

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
  userData: PropTypes.object,
};
