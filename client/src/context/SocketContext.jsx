import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import PropTypes from 'prop-types';

// Create context
export const SocketContext = createContext(null);

// Socket instance (kept outside component to persist across renders)
let socket = null;

// Update the connectSocket function to include auth token
export const connectSocket = () => {
  try {
    if (!socket) {
      // Use base URL without /api/v1 path for socket connections
      const baseUrl = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.split('/api/v1')[0] 
        : 'http://localhost:5050';
      
      console.log(`Connecting socket to: ${baseUrl}`);
      
      // Create socket instance without connecting yet
      socket = io(baseUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: false // Don't connect automatically
      });
    }
    return socket;
  } catch (err) {
    console.error("Failed to initialize socket:", err);
    return null;
  }
};

export function SocketProvider({ children }) {
  const { userData } = useContext(AuthContext);
  const [isConnected, setIsConnected] = useState(false);
  const [socketInstance, setSocketInstance] = useState(null);
  
  // Initialize socket when component mounts
  useEffect(() => {
    if (!socketInstance) {
      const newSocket = connectSocket();
      setSocketInstance(newSocket);
    }
    
    return () => {
      // This cleanup only runs when the provider is unmounted
      // Which typically happens on app shutdown
    };
  }, [socketInstance]);
  
  // Handle connection/disconnection based on auth state
  useEffect(() => {
    // Only attempt connection if we have a socket and user data
    if (!socketInstance || !userData || !userData._id) {
      return;
    }
    
    // Connection handlers
    const handleConnect = () => {
      console.log('Socket connected successfully!');
      setIsConnected(true);
      
      // Authenticate after successful connection
      socketInstance.emit('authenticate', userData._id);
      console.log(`User ${userData._id} authenticated with socket`);
    };
    
    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };
    
    const handleConnectError = (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
    };
    
    // Skill request notifications
    const handleSkillRequestNotification = (data) => {
      console.log('Received notification:', data);
      
      if (data.type === 'skill_request') {
        toast.info(`New skill request: ${data.message}`);
      } else if (data.type === 'skill_request_response') {
        if (data.status === 'accepted') {
          toast.success(data.message);
        } else {
          toast.warn(data.message);
        }
      }
    };
    
    // Setup listeners
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);
    socketInstance.on('notification', handleSkillRequestNotification);
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Set auth token BEFORE connecting
    if (token) {
      console.log('Setting socket auth token before connecting');
      socketInstance.auth = { token };
    } else {
      console.warn('No token available for socket authentication');
      // For development, add a dev flag to bypass auth in development mode
      if (import.meta.env.DEV) {
        socketInstance.handshake = { query: { dev: 'true' } };
      }
    }
    
    // Connect socket if not already connected
    if (!socketInstance.connected) {
      console.log('Attempting socket connection...');
      socketInstance.connect();
    } else {
      // Already connected, just authenticate
      handleConnect();
    }
    
    // Cleanup function to remove listeners when component unmounts
    // or when dependencies change
    return () => {
      console.log('Cleaning up socket listeners');
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.off('notification', handleSkillRequestNotification);
    };
  }, [socketInstance, userData]);
  
  return (
    <SocketContext.Provider value={{ socket: socketInstance, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

// Custom hook for using socket context
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Export getter function instead of the raw socket to prevent issues
export const getSocket = () => socket;

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};