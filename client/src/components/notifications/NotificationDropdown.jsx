import { useState, useEffect, useContext } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { BellIcon as BellIconSolid } from "@heroicons/react/24/solid";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { io } from "socket.io-client";
import PropTypes from 'prop-types';

// Direct socket connection to avoid dependency on socket.js
const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5050");

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { userData } = useContext(AuthContext);

  // Connect to socket and listen for notifications
  useEffect(() => {
    if (!userData?._id) return;

    // Authenticate with socket
    socket.emit("authenticate", userData._id);

    // Listen for new notifications
    socket.on("notification", (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off("notification");
    };
  }, [userData]);

  // Fetch existing notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await API.get("/notifications");
        setNotifications(data || []);
        setUnreadCount((data || []).filter(n => !n.isRead).length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (userData?._id) {
      fetchNotifications();
    }
  }, [userData]);

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Format notification time
  const formatTime = (date) => {
    if (!date) return "recently";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button 
        className="relative p-1 text-gray-700 hover:text-[#69C143] transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        {unreadCount > 0 ? (
          <>
            <BellIconSolid className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-md shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-gray-500">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification._id || `notification-${Math.random()}`} 
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification._id)}
                >
                  <p className="text-sm">{notification.message}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {formatTime(notification.createdAt)}
                    </span>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

NotificationDropdown.propTypes = {
  notifications: PropTypes.array,
  unreadCount: PropTypes.number,
  isOpen: PropTypes.bool,
  userData: PropTypes.object
};

export default NotificationDropdown;
