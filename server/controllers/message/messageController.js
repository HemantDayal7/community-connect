import Message from "../../models/Message.js";
import User from "../../models/User.js";
import Resource from "../../models/Resource.js";
import Notification from "../../models/Notification.js";
import { validationResult } from "express-validator";
import { io } from "../../server.js";

// Get all conversations for the current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log(`Fetching conversations for user: ${userId}`);
    
    // Find all users this user has exchanged messages with
    const sentMessages = await Message.find({ senderId: userId })
      .distinct("recipientId");
    
    const receivedMessages = await Message.find({ recipientId: userId })
      .distinct("senderId");
    
    // Combine and remove duplicates
    const conversationPartnerIds = [...new Set([...sentMessages, ...receivedMessages])];
    
    console.log(`Found ${conversationPartnerIds.length} conversation partners`);
    
    // Get details for each conversation
    const conversations = await Promise.all(
      conversationPartnerIds.map(async (partnerId) => {
        try {
          // Get latest message
          const latestMessage = await Message.findOne({
            $or: [
              { senderId: userId, recipientId: partnerId },
              { senderId: partnerId, recipientId: userId }
            ]
          })
          .sort("-createdAt")
          .limit(1)
          .lean();
          
          // Get user details
          const partnerDetails = await User.findById(partnerId)
            .select("name avatar")
            .lean();
          
          // Count unread messages
          const unreadCount = await Message.countDocuments({
            senderId: partnerId,
            recipientId: userId,
            read: false
          });
          
          return {
            _id: partnerId,
            user: partnerDetails || { _id: partnerId, name: "Unknown User" },
            lastMessage: latestMessage?.content || "",
            lastMessageTime: latestMessage?.createdAt || null,
            unreadCount
          };
        } catch (err) {
          console.error(`Error processing conversation partner ${partnerId}:`, err);
          return {
            _id: partnerId,
            user: { _id: partnerId, name: "Unknown User" },
            lastMessage: "",
            error: true
          };
        }
      })
    );
    
    // Sort by most recent message
    conversations.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
    
    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get messages between current user and another user
export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;
    
    console.log(`Fetching messages between ${userId} and ${otherUserId}`);
    
    if (!otherUserId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId }
      ]
    })
    .sort("createdAt")
    .populate("senderId", "name avatar")
    .populate("recipientId", "name avatar")
    .populate("resourceId", "title image");
    
    console.log(`Found ${messages.length} messages`);
    
    // Mark messages as read
    await Message.updateMany(
      {
        senderId: otherUserId,
        recipientId: userId,
        read: false
      },
      { read: true }
    );
    
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, resourceId } = req.body;
    const senderId = req.user._id;
    
    console.log(`New message: ${senderId} -> ${recipientId}: "${content}"`);
    
    if (!recipientId || !content) {
      return res.status(400).json({ message: "Recipient ID and content are required" });
    }
    
    // Create the message
    const newMessage = new Message({
      senderId,
      recipientId,
      content,
      resourceId: resourceId || null,
      read: false
    });
    
    await newMessage.save();
    
    // Populate and return the message
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "name avatar")
      .populate("recipientId", "name avatar")
      .populate("resourceId", "title image");
    
    // Send real-time notification via Socket.IO
    const io = req.app.get("io");
    if (io) {
      // Emit to the specific user's room
      io.to(recipientId.toString()).emit("message", populatedMessage);
      
      // Create notification
      try {
        const notification = new Notification({
          userId: recipientId,
          message: `New message from ${req.user.name}`,
          type: "message",
          isRead: false,
          actionBy: senderId
        });
        await notification.save();
        
        // Also emit a notification
        io.to(recipientId.toString()).emit("notification", {
          _id: notification._id,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
      }
    }
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    const recipientId = req.user._id;
    
    await Message.updateMany(
      {
        senderId,
        recipientId,
        read: false
      },
      { read: true }
    );
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get unread message counts
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await Message.countDocuments({
      recipientId: userId,
      read: false
    });
    
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};