import { io } from "socket.io-client";

// Get the base URL without /api/v1
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

// Create socket instance with autoConnect: false to prevent immediate connection
const socket = io(BASE_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
});

// Safe connect function to handle connection attempts
export const connectSocket = () => {
  try {
    if (!socket.connected) {
      const token = localStorage.getItem("token");
      
      // Only try to connect if we have a token
      if (token) {
        // Set auth token in handshake query
        socket.auth = { token };
        socket.connect();
        console.log("Socket connecting to:", BASE_URL);
      } else {
        console.warn("Cannot connect socket: No authentication token");
      }
    }
  } catch (error) {
    console.error("Socket connection error:", error);
  }
  
  return socket;
};

export default socket;