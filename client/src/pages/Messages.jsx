import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { format } from "date-fns";
import UserSearchModal from "../components/messaging/UserSearchModal";
import { 
  PlusIcon, CheckIcon, ArrowPathIcon,
  PaperAirplaneIcon, ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import Spinner from "../components/ui/Spinner";

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

  // Memoize fetchConversations with useCallback
  const fetchConversations = useCallback(async () => {
    if (!userData?._id) return;
    
    try {
      setConvLoading(true);
      setConvError(null);
      
      const response = await API.get("/messages/conversations");
      
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
    } catch (err) { // Changed parameter name to err
      console.error("Conversation fetch error:", err);
      setConvError(`Failed to load conversations: ${err.message}`);
    } finally {
      setConvLoading(false);
    }
  }, [userData?._id]);

  // Memoize fetchMessages with useCallback
  const fetchMessages = useCallback(async (userId) => {
    if (!userId || !userData?._id) {
      setMsgError("Invalid user selection");
      return;
    }
    
    try {
      setMsgLoading(true);
      setMsgError(null);
      
      const response = await API.get(`/messages/${userId}`);
      setMessages(response.data);
      
      // If we have messages already, set initialMessageSent to true
      if (response.data.length > 0) {
        setInitialMessageSent(true);
      }
      
    } catch (err) { // Changed parameter name to err
      console.error("Message fetch error:", err);
      setMsgError(`Failed to load messages: ${err.message}`);
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
            } catch (err) { // Changed parameter name to err
              console.error("Error fetching resource context:", err);
              // Resource context is optional, so we continue even if it fails
            }
          }
          
          // Only fetch messages AFTER recipient is set
          await fetchMessages(recipientId);
          
        } catch (err) { // Changed parameter name to err
          console.error("Error fetching recipient details:", err);
          setMsgError(`Failed to load recipient details: ${err.message}`);
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
      
      const response = await API.post("/messages", messageData);
      
      // Replace optimistic message with actual message from server
      setMessages(prev => 
        prev.map(msg => msg._id === tempId ? response.data : msg)
      );
      
      // Refresh conversations list to show the new conversation
      fetchConversations();
    } catch (err) { // Changed parameter name to err
      console.error("Error sending message:", err);
      setSendError(`Failed to send message: ${err.message}`);
      
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
    } catch (err) { // Changed parameter name to err
      console.error("Error starting conversation:", err);
      setMsgError(`Failed to load conversation: ${err.message}`);
    }
  };

  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (err) { // Added parameter name and use
      console.error("Date formatting error:", err);
      return "";
    }
  };

  const getPartnerName = (conversation) => {
    // Make sure we always show the OTHER user's name
    if (!conversation || !conversation.user) return "Unknown User";
    return conversation.user.name;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
          <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2 text-[#69C143]" />
          Messages
        </h1>
        
        <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] gap-4">
          {/* Show the search modal when needed */}
          {showNewChatModal && (
            <UserSearchModal
              onClose={() => setShowNewChatModal(false)}
              onSelectUser={handleSelectUser}
            />
          )}
        
          {/* Conversations Sidebar */}
          <div className="w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="font-semibold text-gray-900 dark:text-white">Conversations</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowNewChatModal(true)}
                  className="bg-[#69C143] hover:bg-[#5aad3a] text-white text-xs px-3 py-1.5 rounded flex items-center transition-colors"
                  aria-label="Start new conversation"
                >
                  <PlusIcon className="h-3.5 w-3.5 mr-1" />
                  New Chat
                </button>
                
                <button 
                  onClick={fetchConversations}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-full"
                  disabled={convLoading}
                  aria-label="Refresh conversations"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${convLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
            
            {convError && (
              <div className="m-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded">
                {convError}
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto">
              {convLoading && conversations.length === 0 ? (
                <div className="flex justify-center items-center p-8">
                  <Spinner size="md" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No conversations yet
                  </p>
                  <button 
                    onClick={() => setShowNewChatModal(true)}
                    className="mt-3 text-[#69C143] hover:text-[#5aad3a] text-sm font-medium"
                  >
                    Start a new conversation
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
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
                        className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          activeRecipient?._id === convo.user?._id ? 
                            "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-[#69C143]" : ""
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3 text-gray-600 dark:text-gray-300 font-semibold">
                            {getPartnerName(convo).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {getPartnerName(convo)}
                              </span>
                              {convo.unreadCount > 0 && (
                                <span className="ml-2 bg-[#69C143] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {convo.unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {convo.lastMessage || "Started a conversation"}
                            </div>
                            {convo.lastMessageTime && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatTime(convo.lastMessageTime)}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Message Area */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col">
            {activeRecipient ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center">
                      <span>{activeRecipient.name}</span>
                    </div>
                    {resourceContext && (
                      <div className="text-sm text-[#69C143] dark:text-[#83d161] flex items-center">
                        <span>Re: {resourceContext.title}</span>
                      </div>
                    )}
                    
                    {/* Add a button to refresh messages */}
                    <button 
                      onClick={() => activeRecipient?._id && fetchMessages(activeRecipient._id)}
                      className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1"
                      disabled={msgLoading}
                    >
                      {msgLoading ? 'Refreshing...' : 'Refresh messages'}
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900/30">
                  {msgError && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded">
                      {msgError}
                    </div>
                  )}
                  
                  {msgLoading && messages.length === 0 ? (
                    <div className="flex justify-center items-center p-8">
                      <Spinner size="md" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                        <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-center mb-2">No messages yet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Send a message to start the conversation!
                      </p>
                    </div>
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
                              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                msg.isOptimistic ? "bg-blue-300 dark:bg-blue-700 text-white" :
                                isOwnMessage
                                  ? "bg-[#69C143] text-white"
                                  : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm"
                              }`}
                            >
                              {/* Only show name for other person's messages */}
                              {!isOwnMessage && (
                                <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
                                  {senderName}
                                </div>
                              )}
                              <div className="break-words">{msg.content}</div>
                              <div className={`text-xs mt-1 ${isOwnMessage ? "text-green-100" : "text-gray-500 dark:text-gray-400"} text-right flex items-center justify-end space-x-1`}>
                                <span>{formatTime(msg.createdAt)}</span>
                                
                                {/* Add read status indicator - only show for your messages */}
                                {isOwnMessage && msg.read && (
                                  <CheckIcon className="h-3 w-3 text-green-100" />
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
                  <div className="mx-4 my-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded">
                    {sendError}
                  </div>
                )}

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 flex">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border dark:border-gray-600 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#69C143] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    disabled={sendLoading}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendLoading || !activeRecipient}
                    className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-4 py-2 rounded-r-lg transition-colors disabled:opacity-50 disabled:hover:bg-[#69C143] flex items-center justify-center"
                  >
                    {sendLoading ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                  No conversation selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
                  Select a conversation from the sidebar or start a new conversation to begin messaging
                </p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-4 py-2 rounded flex items-center transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Start New Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}