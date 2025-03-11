// src/components/layout/MainLayout.jsx
import PropTypes from "prop-types";
import Sidebar from "../ui/Sidebar";
import Navbar from "../ui/Navbar";

export default function MainLayout({ children, userData }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Navbar pinned top (only bell + profile icons) */}
      <Navbar userData={userData} />

      {/* Sidebar pinned left (brand “Community Connect” at top, then Home, etc.) */}
      <Sidebar />

      {/* Main content offset by top-16, left-64 */}
      <div className="pt-16 ml-64 p-6">
        {children}
      </div>
    </div>
  );
}

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
  userData: PropTypes.object,
};
