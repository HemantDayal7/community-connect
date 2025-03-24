// src/components/ui/Sidebar.jsx
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ArchiveBoxIcon,
  AcademicCapIcon,
  CalendarIcon,
  HandRaisedIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  
  // Example of using location:
  const isHomePage = location.pathname === '/';
  
  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  // Collapse/expand sidebar on desktop
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {isHomePage && <div className="text-sm">You are on the home page</div>}
      {/* Mobile Toggle */}
      <button
        onClick={toggleSidebar}
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
        className={`fixed top-16 left-0 h-[calc(100%-4rem)] bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isCollapsed ? "w-16" : "w-64 min-w-[240px]"
        } md:translate-x-0`}
      >
        <nav className="flex flex-col h-full">
          <div className="flex flex-col py-6 space-y-1.5 flex-grow overflow-y-auto px-3">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all ${
                  isActive 
                    ? "bg-[#EAF5EA] text-[#69C143] font-semibold" 
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
              end
            >
              <HomeIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              {!isCollapsed && <span>Home</span>}
            </NavLink>
            
            <NavLink 
              to="/resources" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all ${
                  isActive 
                    ? "bg-[#EAF5EA] text-[#69C143] font-semibold" 
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
            >
              <ArchiveBoxIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              {!isCollapsed && <span>Resource Sharing</span>}
            </NavLink>
            
            <NavLink 
              to="/skillsharing" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all ${
                  isActive 
                    ? "bg-[#EAF5EA] text-[#69C143] font-semibold" 
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
            >
              <AcademicCapIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              {!isCollapsed && <span>Skill Exchange</span>}
            </NavLink>
            
            <NavLink 
              to="/events" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all ${
                  isActive 
                    ? "bg-[#EAF5EA] text-[#69C143] font-semibold" 
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
            >
              <CalendarIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              {!isCollapsed && <span>Community Events</span>}
            </NavLink>
            
            <NavLink 
              to="/help" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all ${
                  isActive 
                    ? "bg-[#EAF5EA] text-[#69C143] font-semibold" 
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
            >
              <HandRaisedIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              {!isCollapsed && <span>Help Requests</span>}
            </NavLink>
            
            <NavLink 
              to="/messages" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all ${
                  isActive 
                    ? "bg-[#EAF5EA] text-[#69C143] font-semibold" 
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              {!isCollapsed && <span>In-App Messaging</span>}
            </NavLink>
          </div>
          
          {/* Collapse toggle button */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <button
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center md:justify-between p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {!isCollapsed && <span>Collapse Sidebar</span>}
              {isCollapsed ? (
                <ChevronRightIcon className="w-5 h-5" />
              ) : (
                <ChevronLeftIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}