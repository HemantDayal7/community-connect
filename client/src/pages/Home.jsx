// src/pages/Home.jsx
import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import {
  ArchiveBoxIcon,
  AcademicCapIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellAlertIcon,
  MapPinIcon,
  UserCircleIcon,
  HomeIcon,
  ComputerDesktopIcon,
  GlobeAmericasIcon,
  ArrowUpIcon,
  WrenchIcon,
  BookOpenIcon,
  DevicePhoneMobileIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function Home() {
  const { userData } = useContext(AuthContext);
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  // Add state for profile dropdown
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);
  
  const [communityData, setCommunityData] = useState({
    stats: { resources: 0, events: 0, helpRequests: 0, skillsShared: 0 },
    recentActivity: [],
    pendingActions: {
      messages: 0,
      borrowRequests: 0,
      skillRequests: 0,
      helpOffers: 0
    },
    nearbyEvents: [],
    recommendedResources: [],
    helpRequestsNearby: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  
  // Handle theme mode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log("Fetching dashboard data...");
        
        // Add a timeout to detect slow responses
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await API.get("/dashboard", { 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        console.log("Dashboard data received:", response.data);
        
        if (response.data && response.data.success) {
          setCommunityData({
            stats: response.data.stats || { resources: 0, events: 0, helpRequests: 0, skillsShared: 0 },
            recentActivity: response.data.recentActivity || [],
            pendingActions: response.data.pendingActions || {
              messages: 0,
              borrowRequests: 0,
              skillRequests: 0,
              helpOffers: 0
            },
            nearbyEvents: response.data.nearbyEvents || [],
            recommendedResources: response.data.recommendedResources || [],
            helpRequestsNearby: response.data.helpRequestsNearby || []
          });
        } else {
          console.error("Invalid response format:", response.data);
          setError("Failed to load dashboard data: Invalid response format");
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        // More detailed error logging
        if (error.name === 'AbortError') {
          setError("Request timed out. Server may be overloaded.");
        } else if (error.response) {
          console.log("Error status:", error.response.status);
          console.log("Error data:", error.response.data);
          
          if (error.response.status === 401) {
            setError("Authentication error. Please log in again.");
          } else {
            setError(`Server error: ${error.response.data?.message || error.message}`);
          }
        } else if (error.request) {
          console.log("No response received:", error.request);
          setError("No response from server. Check your internet connection.");
        } else {
          setError(`Error: ${error.message}`);
        }
        
        // Set default data regardless of error
        setCommunityData({
          stats: { resources: 0, events: 0, helpRequests: 0, skillsShared: 0 },
          recentActivity: [],
          pendingActions: {
            messages: 0,
            borrowRequests: 0, 
            skillRequests: 0,
            helpOffers: 0
          },
          nearbyEvents: [],
          recommendedResources: [],
          helpRequestsNearby: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (userData && userData._id) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [userData]);
  
  // Real-time updates with socket
  useEffect(() => {
    if (!userData?._id || !socket) return;
    
    // Listen for new activities
    const handleNewActivity = (activity) => {
      setCommunityData(prev => ({
        ...prev,
        recentActivity: [activity, ...prev.recentActivity.slice(0, 9)]
      }));
    };
    
    // Listen for stat updates
    const handleStatsUpdate = (stats) => {
      setCommunityData(prev => ({
        ...prev,
        stats: { ...prev.stats, ...stats }
      }));
    };
    
    // Listen for pending actions updates
    const handlePendingUpdate = (actions) => {
      setCommunityData(prev => ({
        ...prev,
        pendingActions: { ...prev.pendingActions, ...actions }
      }));
    };
    
    // Register listeners
    socket.on('new_activity', handleNewActivity);
    socket.on('stats_update', handleStatsUpdate);
    socket.on('pending_update', handlePendingUpdate);
    
    // Clean up
    return () => {
      socket.off('new_activity', handleNewActivity);
      socket.off('stats_update', handleStatsUpdate);
      socket.off('pending_update', handlePendingUpdate);
    };
  }, [userData, socket]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Example usage
  const handleViewAllResources = () => {
    navigate('/resources');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#69C143]"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 bg-red-50 border border-red-200 rounded-md mt-4">
        <h1 className="text-2xl font-bold mb-2">Dashboard Unavailable</h1>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Calculate total pending actions
  const totalPending = Object.values(communityData.pendingActions).reduce((a, b) => a + b, 0);
  
  return (
    <div className="container mx-auto px-6 py-8">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-[#69C143] to-blue-500 text-white rounded-lg shadow-lg p-8 mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {userData?.name || "Neighbor"}!</h1>
            <p className="text-lg opacity-90">Building stronger communities through sharing and support</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <div className="hidden md:block relative" ref={profileDropdownRef}>
              <div 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                {userData?.profileImage ? (
                  <img 
                    src={userData.profileImage} 
                    alt={userData.name} 
                    className="w-16 h-16 rounded-full border-2 border-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center text-2xl font-bold">
                    {userData?.name?.[0] || "C"}
                  </div>
                )}
              </div>
              
              {/* Profile Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium dark:text-white">{userData?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userData?.email}</p>
                  </div>
                  
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <UserCircleIcon className="w-4 h-4 mr-2" />
                    View My Profile
                  </Link>
                  
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center font-medium"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                    Complete Your Profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions & Notifications Row */}
      {totalPending > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8"
        >
          <div className="flex items-center text-amber-800">
            <BellAlertIcon className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">Pending Actions</h2>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {communityData.pendingActions.messages > 0 && (
              <Link to="/messages" className="flex items-center p-2 bg-white rounded-md hover:bg-amber-100">
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 text-blue-500" />
                <span>{communityData.pendingActions.messages} unread message{communityData.pendingActions.messages !== 1 ? 's' : ''}</span>
              </Link>
            )}
            {communityData.pendingActions.borrowRequests > 0 && (
              <Link to="/resources" className="flex items-center p-2 bg-white rounded-md hover:bg-amber-100">
                <ArchiveBoxIcon className="w-5 h-5 mr-2 text-green-500" />
                <span>{communityData.pendingActions.borrowRequests} resource request{communityData.pendingActions.borrowRequests !== 1 ? 's' : ''}</span>
              </Link>
            )}
            {communityData.pendingActions.skillRequests > 0 && (
              <Link to="/skill-requests" className="flex items-center p-2 bg-white rounded-md hover:bg-amber-100">
                <AcademicCapIcon className="w-5 h-5 mr-2 text-purple-500" />
                <span>{communityData.pendingActions.skillRequests} skill request{communityData.pendingActions.skillRequests !== 1 ? 's' : ''}</span>
              </Link>
            )}
            {communityData.pendingActions.helpOffers > 0 && (
              <Link to="/help" className="flex items-center p-2 bg-white rounded-md hover:bg-amber-100">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-red-500" />
                <span>{communityData.pendingActions.helpOffers} help offer{communityData.pendingActions.helpOffers !== 1 ? 's' : ''}</span>
              </Link>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick Actions Row */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <Link to="/resources" className="icon-bounce bg-green-100 hover:bg-green-200 p-6 rounded-lg flex flex-col items-center justify-center transition-all transform hover:scale-105 hover:shadow-md">
          <ArchiveBoxIcon className="w-10 h-10 text-green-600 mb-2" />
          <span className="text-green-800 font-medium">Share a Resource</span>
        </Link>
        <Link to="/skillsharing" className="icon-bounce bg-blue-100 hover:bg-blue-200 p-6 rounded-lg flex flex-col items-center justify-center transition-all transform hover:scale-105 hover:shadow-md">
          <AcademicCapIcon className="w-10 h-10 text-blue-600 mb-2" />
          <span className="text-blue-800 font-medium">Offer a Skill</span>
        </Link>
        <Link to="/help" className="icon-bounce bg-amber-100 hover:bg-amber-200 p-6 rounded-lg flex flex-col items-center justify-center transition-all transform hover:scale-105 hover:shadow-md">
          <ExclamationTriangleIcon className="w-10 h-10 text-amber-600 mb-2" />
          <span className="text-amber-800 font-medium">Request Help</span>
        </Link>
        <Link to="/events" className="icon-bounce bg-purple-100 hover:bg-purple-200 p-6 rounded-lg flex flex-col items-center justify-center transition-all transform hover:scale-105 hover:shadow-md">
          <CalendarIcon className="w-10 h-10 text-purple-600 mb-2" />
          <span className="text-purple-800 font-medium">Create Event</span>
        </Link>
      </motion.div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Community Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <UserGroupIcon className="w-6 h-6 mr-2 text-blue-500" />
              Community Activity
            </h2>
            {communityData.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {communityData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start border-b border-gray-100 pb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-600 mr-3">
                      {activity.user?.[0] || activity.userName?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description || "Activity details unavailable"}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time ? new Date(activity.time).toLocaleString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                {/* Previous empty state replaced with more engaging content */}
                <div className="flex flex-col items-center justify-center py-4">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium">Be the first to contribute!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">
                    Activities appear here when community members share resources, skills, or organize events.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Link to="/resources" className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md transition-colors">
                      Share a Resource
                    </Link>
                    <Link to="/events" className="text-sm bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-md transition-colors">
                      Create an Event
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Help Requests That Need Attention */}
          {communityData.helpRequestsNearby && communityData.helpRequestsNearby.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-amber-500" />
                Help Requests Nearby
              </h2>
              <div className="space-y-3">
                {communityData.helpRequestsNearby.slice(0, 3).map((request, idx) => (
                  <Link key={request._id || idx} to={`/help`} className="block">
                    <div className="bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 p-4 rounded-lg transition-colors border border-amber-200 dark:border-amber-800/50">
                      <h3 className="font-medium text-gray-900 dark:text-white text-base">{request.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{request.description}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs inline-flex items-center px-2.5 py-1 rounded-full bg-white dark:bg-gray-700">
                          {/* Add category icon based on category */}
                          {request.category === "Home" && <HomeIcon className="h-3 w-3 mr-1 text-amber-600" />}
                          {request.category === "Tech" && <ComputerDesktopIcon className="h-3 w-3 mr-1 text-amber-600" />}
                          {request.category === "Garden" && <GlobeAmericasIcon className="h-3 w-3 mr-1 text-amber-600" />}
                          {/* Default icon if category doesn't match */}
                          {!["Home", "Tech", "Garden"].includes(request.category) && 
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1 text-amber-600" />}
                          <span className="text-amber-700 dark:text-amber-300">{request.category}</span>
                        </span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault(); // Prevent navigation to /help
                            navigate(`/help?respond=${request._id}`);
                          }}
                          className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-md transition-colors"
                        >
                          Offer Help
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/help" className="text-blue-500 hover:underline mt-4 inline-block">
                View all help requests →
              </Link>
            </div>
          )}
          
          {/* Nearby Events */}
          {communityData.nearbyEvents && communityData.nearbyEvents.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MapPinIcon className="w-6 h-6 mr-2 text-red-500" />
                Events Near You
              </h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {communityData.nearbyEvents.slice(0, 4).map((event, idx) => (
                  <div key={event._id || idx} className="block">
                    <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-4 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
                      {/* Category label with color based on type */}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{event.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          event.category === "Education" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" :
                          event.category === "Arts & Culture" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300" :
                          event.category === "Fitness" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" :
                          event.category === "Social" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300" :
                          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}>
                          {event.category || "Community"}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {event.location}
                      </div>
                      
                      {/* Event actions */}
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => {
                            navigate(`/events?details=${event._id}`);
                          }}
                          className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-2 py-1.5 rounded transition-colors"
                        >
                          Details
                        </button>
                        <button 
                          onClick={() => {
                            navigate(`/events?rsvp=${event._id}`);
                          }}
                          className="flex-1 text-xs bg-purple-500 hover:bg-purple-600 text-white px-2 py-1.5 rounded transition-colors"
                        >
                          RSVP
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/events" className="text-blue-500 hover:underline mt-4 inline-block">
                View all events →
              </Link>
            </div>
          )}
        </motion.div>
        
        {/* Right Column */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          {/* Community Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
            <h2 className="text-xl font-semibold mb-3 flex items-center text-gray-900 dark:text-white">
              <ChartBarIcon className="w-6 h-6 mr-2 text-indigo-500" />
              Community Stats
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-3">
                  <ArchiveBoxIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Resources</span>
                  <div className="flex items-center">
                    <p className="font-bold text-lg text-gray-900 dark:text-white">{communityData.stats.resources}</p>
                    {/* Growth indicator - this should come from API in real app */}
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                      <ArrowUpIcon className="h-3 w-3 mr-0.5" />
                      <span>12%</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3">
                  <AcademicCapIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Skills</span>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">{communityData.stats.skillsShared}</p>
                </div>
              </div>
              
              <div className="flex items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-3">
                  <CalendarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Events</span>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">{communityData.stats.events}</p>
                </div>
              </div>
              
              <div className="flex items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-3">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Help</span>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">{communityData.stats.helpRequests}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recommended Resources */}
          {communityData.recommendedResources && communityData.recommendedResources.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Resources For You</h2>
              <div className="space-y-3">
                {communityData.recommendedResources.slice(0, 3).map((resource, idx) => (
                  <div key={resource._id || idx} className="block">
                    <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-4 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start gap-3">
                        {/* Resource image or placeholder */}
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center flex-shrink-0">
                          {resource.category === "Tools" && <WrenchIcon className="h-6 w-6 text-gray-500" />}
                          {resource.category === "Books" && <BookOpenIcon className="h-6 w-6 text-gray-500" />}
                          {resource.category === "Electronics" && <DevicePhoneMobileIcon className="h-6 w-6 text-gray-500" />}
                          {!["Tools", "Books", "Electronics"].includes(resource.category) && 
                            <ArchiveBoxIcon className="h-6 w-6 text-gray-500" />}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{resource.title}</h3>
                          
                          <div className="flex items-center mt-1">
                            <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full">{resource.category}</span>
                            {resource.ownerId && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                Shared by {resource.ownerId.name || 'Community Member'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex mt-3 gap-2">
                        <button 
                          onClick={() => navigate(`/resources?view=${resource._id}`)}
                          className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-2 py-1.5 rounded transition-colors"
                        >
                          Details
                        </button>
                        <button 
                          onClick={() => navigate(`/resources?borrow=${resource._id}`)}
                          className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded transition-colors"
                        >
                          Borrow
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/resources" className="text-blue-500 hover:underline mt-4 inline-block">
                Browse all resources →
              </Link>
              <button onClick={handleViewAllResources}>View All Resources</button>
            </div>
          )}
          
          {/* Helpful Resources Card */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-3">Getting Started</h2>
            <p className="mb-4 opacity-90">Build your community profile and get the most out of Community Connect</p>
            <div className="space-y-3">
              <Link to="/profile" className="flex items-center text-white hover:bg-blue-600/50 p-2 rounded transition-colors">
                <UserCircleIcon className="h-5 w-5 mr-3" />
                <span>Complete your profile</span>
              </Link>
              <Link to="/resources" className="flex items-center text-white hover:bg-blue-600/50 p-2 rounded transition-colors">
                <ArchiveBoxIcon className="h-5 w-5 mr-3" />
                <span>Share your first resource</span>
              </Link>
              <Link to="/skillsharing" className="flex items-center text-white hover:bg-blue-600/50 p-2 rounded transition-colors">
                <AcademicCapIcon className="h-5 w-5 mr-3" />
                <span>Offer a skill</span>
              </Link>
              <Link to="/help" className="flex items-center text-white hover:bg-blue-600/50 p-2 rounded transition-colors">
                <ExclamationTriangleIcon className="h-5 w-5 mr-3" />
                <span>Ask for help</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
