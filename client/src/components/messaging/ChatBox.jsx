import { useState, useEffect, useRef, useContext } from "react";
import { XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { AuthContext } from "../../context/AuthContext";
import PropTypes from "prop-types";
import API from "../../services/api";
import socket from "../../services/socket";

const ChatBox = ({ recipientId, recipientName, resourceId, initialMessage = "", onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const { userData } = useContext(AuthContext);
  const messagesEndRef = useRef(null);
  const [resourceDetails, setResourceDetails] = useState(null);
  const [socketError, setSocketError] = useState(null);
  
  // Update newMessage when initialMessage changes
  useEffect(() => {
    if (initialMessage) {
      setNewMessage(initialMessage);
    }
  }, [initialMessage]);
  
  // Fetch message history and resource details
  useEffect(() => {
    const fetchMessages = async () => {
      if (!recipientId || !userData?._id) {
        console.log("Missing recipient or user data, skipping message fetch");
        return;
      }
      
      setLoading(true);
      try {
        const { data } = await API.get(`/messages/${recipientId}`);
        // Ensure data is an array before setting in state
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          console.error("Expected message data to be an array, received:", data);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    if (resourceId) {
      const fetchResourceDetails = async () => {
        try {
          const { data } = await API.get(`/resources/${resourceId}`);
          setResourceDetails(data);
        } catch (error) {
          console.error("Error fetching resource details:", error);
        }
      };
      fetchResourceDetails();
    }
  }, [recipientId, resourceId, userData?._id]);
  
  // Setup socket connection and listeners
  useEffect(() => {
    // Only setup listeners if we have both user data and recipient ID
    if (!userData?._id || !recipientId) {
      return;
    }
    
    // Check if socket is connected first
    if (!socket.connected) {
      console.log("Socket not connected, attempting to connect...");
      try {
        socket.connect();
        socket.on("connect", () => {
          console.log("Socket connected successfully");
        });
        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err);
          setSocketError("Chat connection failed. Messages may be delayed.");
        });
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        setSocketError("Chat connection failed. Messages may be delayed.");
      }
    }
    
    // Define message handler
    const handleNewMessage = (message) => {
      console.log("New message received via socket:", message);
      if (
        (message.senderId === recipientId && message.receiverId === userData._id) ||
        (message.senderId === userData._id && message.receiverId === recipientId)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };
    
    // Setup listeners
    try {
      socket.on("message", handleNewMessage);
    } catch (error) {
      console.error("Error setting up socket listeners:", error);
      setSocketError("Chat connection error. Please refresh.");
    }
    
    // Cleanup listeners on unmount
    return () => {
      try {
        socket.off("message", handleNewMessage);
      } catch (error) {
        console.error("Error removing socket listeners:", error);
      }
    };
  }, [recipientId, userData?._id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const formatMessageTime = (date) => {
    try {
      return format(new Date(date), "h:mm a");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "";
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !recipientId || !userData?._id) return;
    
    const messageData = {
      recipientId,
      content: newMessage,
      resourceId: resourceId || undefined,
    };
    
    console.log("Sending message with data:", messageData);
    
    try {
      const { data } = await API.post("/messages", messageData);
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };
  
  // Safe render with error boundary
  if (!userData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
          <p>Please log in to use the messaging feature.</p>
          <button 
            onClick={onClose}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col h-[600px] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="font-semibold text-lg">{recipientName || "Chat"}</h3>
            {resourceDetails && (
              <p className="text-sm text-gray-500">About: {resourceDetails?.title}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Socket Error Message */}
        {socketError && (
          <div className="bg-red-50 text-red-700 p-2 text-sm text-center">
            {socketError}
          </div>
        )}
        
        {/* Resource Context */}
        {resourceDetails && (
          <div className="bg-blue-50 p-3 mx-4 mt-3 rounded-md flex items-center">
            {resourceDetails.image && (
              <img 
                src={resourceDetails.image.startsWith('http') ? resourceDetails.image : `http://localhost:5050/${resourceDetails.image}`} 
                alt={resourceDetails.title} 
                className="w-12 h-12 object-cover rounded mr-3"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-image.png';
                }}
              />
            )}
            <div>
              <p className="font-medium">{resourceDetails?.title}</p>
              <p className="text-sm text-gray-600">
                {resourceDetails?.availability === "available" ? "Available" : "Currently Borrowed"}
              </p>
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#69C143]"></div>
            </div>
          ) : (
            <>
              {!messages || messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No messages yet.</p>
                  <p>Send a message to start the conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message?._id || index}
                    className={`mb-3 flex ${
                      message?.senderId === userData?._id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2 rounded-lg max-w-[80%] ${
                        message?.senderId === userData?._id ? "bg-[#69C143] text-white" : "bg-gray-200"
                      }`}
                    >
                      <p>{message?.content}</p>
                      <p className="text-xs opacity-75 text-right mt-1">
                        {formatMessageTime(message?.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="border-t p-4 flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#69C143]"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-[#69C143] hover:bg-[#5AAF34] text-white rounded-r-md px-4 py-2 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

ChatBox.propTypes = {
  recipientId: PropTypes.string.isRequired,
  recipientName: PropTypes.string.isRequired,
  resourceId: PropTypes.string,
  initialMessage: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default ChatBox;