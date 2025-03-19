import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { format } from "date-fns";
import UserSearchModal from "../components/messaging/UserSearchModal";
import { PlusIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function Messages() {
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const { userData } = useContext(AuthContext);
  
  // State variables
  const [activeRecipient, setActiveRecipient] = useState(null);
  const [resourceContext, setResourceContext] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  
  // Separate loading states
  const [convLoading, setConvLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  
  // Error states
  const [convError, setConvError] = useState(null);
  const [msgError, setMsgError] = useState(null);
  const [sendError, setSendError] = useState(null);
  
  // Debug logging
  useEffect(() => {
    console.log("Current userData:", userData?._id);
  }, [userData]);

  // Memoize fetchConversations with useCallback to avoid recreation on every render
  const fetchConversations = useCallback(async () => {
    if (!userData?._id) {
      console.log("Can't fetch conversations - user not logged in");
      return;
    }
    
    try {
      setConvLoading(true);
      setConvError(null);
      
      const response = await API.get("/messages/conversations");
      console.log("Conversations loaded:", response.data.length);
      
      // Ensure we have no duplicates by using a Map with userId as key
      const uniqueConversations = {};
      response.data.forEach(convo => {
        if (convo.user && convo.user._id) {
          uniqueConversations[convo.user._id] = convo;
        }
      });
      
      // Convert back to array and sort by last message time
      const uniqueArray = Object.values(uniqueConversations);
      uniqueArray.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      });
      
      setConversations(uniqueArray);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConvError("Failed to load conversations. Please try again.");
    } finally {
      setConvLoading(false);
    }
  }, [userData?._id]);

  // Memoize fetchMessages with useCallback
  const fetchMessages = useCallback(async (userId) => {
    if (!userId) {
      console.warn("Attempted to fetch messages with undefined userId");
      setMsgError("Invalid user selection");
      return;
    }
    
    if (!userData?._id) {
      console.warn("Can't fetch messages - user not logged in");
      return;
    }
    
    try {
      setMsgLoading(true);
      setMsgError(null);
      
      console.log(`Fetching messages with user: ${userId}`);
      const response = await API.get(`/messages/${userId}`);
      console.log(`Messages fetched successfully: ${response.data.length}`);
      setMessages(response.data);
      
      // If we have messages already, set initialMessageSent to true
      if (response.data.length > 0) {
        setInitialMessageSent(true);
      }
      
    } catch (error) {
      console.error(`Error fetching messages for userId ${userId}:`, error);
      setMsgError("Failed to load messages. Please try again.");
    } finally {
      setMsgLoading(false);
    }
  }, [userData?._id]);

  // Parse query parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    // Check both possible parameter names for compatibility
    const recipientId = searchParams.get("with") || searchParams.get("to");
    const resourceId = searchParams.get("resource");
    const resourceTitle = searchParams.get("resourceTitle");
    const contextType = searchParams.get("contextType");
    const contextId = searchParams.get("contextId");

    console.log("Query params:", { recipientId, resourceId, resourceTitle, contextType, contextId });

    if (recipientId) {
      const fetchRecipientDetails = async () => {
        try {
          setMsgLoading(true);
          setMsgError(null);
          
          const response = await API.get(`/users/${recipientId}`);
          if (!response || !response.data) {
            throw new Error("Invalid response when fetching user details");
          }
          
          const recipientData = {
            _id: recipientId,
            name: response.data.name || "Unknown User",
            ...response.data
          };
          
          setActiveRecipient(recipientData);
          console.log("Recipient data loaded:", recipientData);
          
          // Set initial message only if this is a new conversation and context is provided
          if (resourceTitle) {
            const initialMsg = `Hi! I'm interested in your "${resourceTitle}"`;
            setNewMessage(initialMsg);
          } else if (contextType === "skill_request") {
            // Add custom initial message for skill requests
            const initialMsg = "Hi! I'm responding to your skill request. When would you like to schedule this?";
            setNewMessage(initialMsg);
          }
          
          if (resourceId) {
            try {
              const resourceResponse = await API.get(`/resources/${resourceId}`);
              setResourceContext(resourceResponse.data);
            } catch (error) {
              console.error("Error fetching resource:", error);
            }
          }
          
          // Only fetch messages AFTER recipient is set
          await fetchMessages(recipientId);
          
        } catch (error) {
          console.error("Error fetching recipient details:", error);
          setMsgError("Failed to load recipient details. Please try again.");
        } finally {
          setMsgLoading(false);
        }
      };
      
      fetchRecipientDetails();
    }
    
    fetchConversations();
  }, [location.search, userData?._id, fetchConversations, fetchMessages]);

  // Check if we have existing messages and clear initial message if needed
  useEffect(() => {
    if (messages.length > 0 && !initialMessageSent) {
      // If we already have messages in this conversation, don't use the initial message
      setInitialMessageSent(true);
    }
  }, [messages, initialMessageSent]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRecipient || sendLoading || !userData?._id) return;

    const messageText = newMessage;
    const tempId = Date.now().toString();
    const optimisticMessage = {
      _id: tempId,
      senderId: {
        _id: userData._id,
        name: userData.name
      },
      recipientId: {
        _id: activeRecipient._id,
        name: activeRecipient.name
      },
      content: messageText,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    // Add optimistic message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setInitialMessageSent(true);

    try {
      setSendLoading(true);
      setSendError(null);
      
      const messageData = {
        recipientId: activeRecipient._id,
        content: messageText,
        resourceId: resourceContext?._id
      };
      
      console.log("Sending message with data:", messageData);
      
      const response = await API.post("/messages", messageData);
      console.log("Message sent successfully:", response.data);
      
      // Replace optimistic message with actual message from server
      setMessages(prev => 
        prev.map(msg => msg._id === tempId ? response.data : msg)
      );
      
      // Refresh conversations list to show the new conversation
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      setSendError("Failed to send message. Please try again.");
      
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      // Restore the message to input field
      setNewMessage(messageText);
    } finally {
      setSendLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    // Close the modal
    setShowNewChatModal(false);
    
    // Set the selected user as active recipient
    setActiveRecipient(user);
    
    // Clear resource context as this is a direct message
    setResourceContext(null);
    
    // Clear any pre-filled message
    setNewMessage("");
    
    try {
      // Fetch existing messages if any
      await fetchMessages(user._id);
    } catch (error) {
      console.error("Error starting conversation:", error);
      setMsgError("Failed to load conversation");
    }
  };

  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch {
      return "";
    }
  };

  const getPartnerName = (conversation) => {
    // Make sure we always show the OTHER user's name
    if (!conversation || !conversation.user) return "Unknown User";
    return conversation.user.name;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      
      <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] gap-4">
        {/* Show the search modal when needed */}
        {showNewChatModal && (
          <UserSearchModal
            onClose={() => setShowNewChatModal(false)}
            onSelectUser={handleSelectUser}
          />
        )}
      
        {/* Conversations Sidebar */}
        <div className="w-full md:w-1/4 bg-white rounded-lg shadow p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Conversations</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowNewChatModal(true)}
                className="bg-blue-500 text-white text-xs px-3 py-1 rounded hover:bg-blue-600 flex items-center"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                New Chat
              </button>
              
              <button 
                onClick={fetchConversations}
                className="text-xs text-blue-500 hover:text-blue-700"
                disabled={convLoading}
              >
                {convLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {convError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
              {convError}
            </div>
          )}
          
          {convLoading && conversations.length === 0 ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-gray-500 text-center text-sm">No conversations yet</p>
          ) : (
            <ul className="space-y-2">
              {conversations.map((convo) => (
                <li key={convo._id || convo.user?._id || Math.random().toString()}>
                  <button
                    onClick={() => {
                      if (convo.user && convo.user._id) {
                        setActiveRecipient(convo.user);
                        fetchMessages(convo.user._id);
                        setResourceContext(null);
                        // Clear any pre-filled message when switching conversations
                        setNewMessage("");
                      }
                    }}
                    className={`w-full text-left p-2 rounded hover:bg-gray-100 ${
                      activeRecipient?._id === convo.user?._id ? 
                        "bg-blue-50 border-l-4 border-blue-500" : ""
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="font-medium">{getPartnerName(convo)}</div>
                      {convo.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {convo.lastMessage || "Started a conversation"}
                    </div>
                    {convo.lastMessageTime && (
                      <div className="text-xs text-gray-400 mt-1">
                        {formatTime(convo.lastMessageTime)}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Message Area */}
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
          {activeRecipient ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <div className="font-semibold">{activeRecipient.name}</div>
                  {resourceContext && (
                    <div className="text-sm text-blue-600">
                      Re: {resourceContext.title}
                    </div>
                  )}
                </div>
                
                {/* Add a button to refresh messages */}
                <button 
                  onClick={() => activeRecipient?._id && fetchMessages(activeRecipient._id)}
                  className="text-xs text-blue-500 hover:text-blue-700"
                  disabled={msgLoading}
                >
                  {msgLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                {msgError && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                    {msgError}
                  </div>
                )}
                
                {msgLoading && messages.length === 0 ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      // Safely determine if this message is from the current user
                      const msgSenderId = typeof msg.senderId === 'object' ? 
                        msg.senderId._id : msg.senderId;
                      
                      const isOwnMessage = msgSenderId === userData?._id;
                      
                      // Get sender name for display
                      const senderName = typeof msg.senderId === 'object' && msg.senderId.name ? 
                        msg.senderId.name : 
                        (isOwnMessage ? userData?.name || "You" : activeRecipient?.name || "Sender");
                      
                      return (
                        <div
                          key={msg._id || Math.random().toString()}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              msg.isOptimistic ? "bg-blue-300 text-white" :
                              isOwnMessage
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {/* Only show name for other person's messages */}
                            {!isOwnMessage && (
                              <div className="text-xs font-medium mb-1">
                                {senderName}
                              </div>
                            )}
                            <div className="break-words">{msg.content}</div>
                            <div className={`text-xs mt-1 ${isOwnMessage ? "text-blue-200" : "text-gray-500"} text-right flex items-center justify-end space-x-1`}>
                              <span>{formatTime(msg.createdAt)}</span>
                              
                              {/* Add read status indicator - only show for your messages */}
                              {isOwnMessage && msg.read && (
                                <CheckIcon className="h-3 w-3 text-blue-200" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} /> {/* Scroll anchor */}
                  </div>
                )}
              </div>

              {/* Error feedback for send operation */}
              {sendError && (
                <div className="mx-4 my-2 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                  {sendError}
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sendLoading}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendLoading || !activeRecipient}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {sendLoading ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">
                Select a conversation or click &quot;Message&quot; on a resource to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}