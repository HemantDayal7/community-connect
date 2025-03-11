// src/components/ui/Sidebar.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ArchiveBoxIcon,
  AcademicCapIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Highlight the active link
  const isActive = (path) =>
    location.pathname === path
      ? "flex items-center text-[#69C143] font-medium"
      : "flex items-center text-gray-700 hover:text-[#69C143] transition-colors";

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 left-4 z-50 text-gray-700 dark:text-gray-200 p-2 md:hidden bg-white dark:bg-gray-800 rounded shadow-md"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar Container */}
      <div
        className={`fixed top-16 left-0 h-[calc(100%-4rem)] w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform md:translate-x-0 z-40`}
      >
        <nav className="flex flex-col px-4 py-6 space-y-6">
          


          {/* Now the Home link appears below the logo */}
          <Link to="/home" className={isActive("/home")}>
            <HomeIcon className="w-5 h-5 mr-3" />
            <span>Home</span>
          </Link>
          <Link to="/resources" className={isActive("/resources")}>
            <ArchiveBoxIcon className="w-5 h-5 mr-3" />
            <span>Resource Sharing</span>
          </Link>
          <Link to="/skills" className={isActive("/skills")}>
            <AcademicCapIcon className="w-5 h-5 mr-3" />
            <span>Skill Exchange</span>
          </Link>
          <Link to="/events" className={isActive("/events")}>
            <CalendarIcon className="w-5 h-5 mr-3" />
            <span>Community Events</span>
          </Link>
          <Link to="/help" className={isActive("/help")}>
            <ExclamationTriangleIcon className="w-5 h-5 mr-3" />
            <span>Help Requests</span>
          </Link>
          <Link to="/messages" className={isActive("/messages")}>
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3" />
            <span>In-App Messaging</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
