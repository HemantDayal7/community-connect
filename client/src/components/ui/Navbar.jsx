// src/components/ui/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { UserCircleIcon, BellIcon, StarIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ userData }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Close dropdown if user clicks outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    setShowDropdown(false);
    navigate("/login");
  };

  return (
    // Full-width navbar pinned at top
    <nav className="bg-white dark:bg-gray-900 shadow-md fixed top-0 left-0 w-full z-40">
      <div className="w-full px-6 py-3 flex justify-between items-center">
        
        {/* Left: Community Connect logo */}
        <div className="text-2xl font-bold italic text-[#69C143]">
          Community Connect
        </div>

        {/* Right: Notification Bell + User Dropdown */}
        <div className="flex items-center space-x-6">
          <button className="text-gray-600 dark:text-gray-200 hover:text-gray-800">
            <BellIcon className="h-6 w-6" />
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-md"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {userData?.name || "Guest"}
              </span>
              {userData?.avatarUrl ? (
                <img
                  src={userData.avatarUrl}
                  alt="User Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-gray-600 dark:text-gray-200 hover:text-gray-800" />
              )}
            </div>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Trust Score:</strong>{" "}
                  <span className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                    {userData?.trustScore?.toFixed(1) || "5.0"}
                    <span className="text-xs text-gray-500 ml-1">
                      ({userData?.totalReviews || 0} reviews)
                    </span>
                  </span>
                </p>
                {userData?.email && (
                  <div className="py-2">
                    <p className="text-sm text-gray-700 dark:text-gray-200 break-all">
                      <span className="font-medium">Email:</span> {userData.email}
                    </p>
                  </div>
                )}
                <hr className="my-1 border-gray-300 dark:border-gray-600" />
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-2 py-2 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  userData: PropTypes.object,
};
