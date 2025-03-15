import { useState, useEffect, useRef, useContext } from "react";
import { XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { AuthContext } from "../../context/AuthContext";
import PropTypes from 'prop-types';
import API from "../../services/api";
// Use the shared socket service instead of creating a new one
import socket, { connectSocket } from "../../services/socket";

const ChatModal = ({ recipientId, recipientName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { userData } = useContext(AuthContext);
  const messagesEndRef = useRef(null);
  
  // Connect socket if needed
  useEffect(() => {
    if (!socket.connected && userData?._id) {
      connectSocket();
    }
    // Rest of your code...
  }, [userData?._id]);

  // Fetch previous messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/messages/${recipientId}`);
        setMessages(data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    if (recipientId && userData?._id) {
      fetchMessages();
      // Join a unique room for this conversation
      const roomId = [userData._id, recipientId].sort().join('-');
      socket.emit('joinRoom', { roomId });
    }
    
    return () => {
      if (recipientId && userData?._id) {
        const roomId = [userData._id, recipientId].sort().join('-');
        socket.emit('leaveRoom', { roomId });
      }
    };
  }, [recipientId, userData?._id]);

  // Listen for incoming messages
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      if (
        (message.sender === recipientId && message.recipient === userData?._id) ||
        (message.sender === userData?._id && message.recipient === recipientId) ||
        (message.senderId === recipientId && message.receiverId === userData?._id) ||
        (message.senderId === userData?._id && message.receiverId === recipientId)
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };
    
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("message", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("message", handleReceiveMessage);
    };
  }, [recipientId, userData?._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !userData?._id) return;

    // Prepare the message
    const messageData = {
      senderId: userData._id,
      recipientId: recipientId,
      from: userData._id,
      to: recipientId,
      content: newMessage,
      message: newMessage,
      senderName: userData.name
    };

    // Optimistically add to UI
    setMessages([...messages, { ...messageData, createdAt: new Date(), isRead: false }]);
    setNewMessage("");

    // Send via socket
    socket.emit("sendMessage", messageData);
    
    // Also save to DB via API (as a backup)
    try {
      await API.post("/messages", messageData);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatMessageTime = (date) => {
    try {
      return format(new Date(date), "h:mm a");
    } catch {
      // No named 'error' parameter since it's not being used
      return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow w-full max-w-lg h-[600px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">{recipientName || "Chat"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <div className="text-center py-4">Loading messages...</div>}
          
          {!loading && messages.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          )}
          
          {messages.map((message, index) => {
            const isMe = (message.senderId === userData?._id) || (message.sender === userData?._id);
            return (
              <div
                key={message._id || index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    isMe
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-100 rounded-bl-none"
                  }`}
                >
                  <p>{message.content || message.message}</p>
                  <p className={`text-xs mt-1 ${isMe ? "text-blue-100" : "text-gray-500"}`}>
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <form onSubmit={handleSend} className="border-t p-4 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600"
            disabled={!newMessage.trim()}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

// Add PropTypes validation
ChatModal.propTypes = {
  recipientId: PropTypes.string.isRequired,
  recipientName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ChatModal;