import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount
} from "../../controllers/message/messageController.js";

const router = express.Router();

// Get all conversations for the current user
router.get("/conversations", protect, getConversations);

// Get messages between current user and another user
router.get("/:userId", protect, getMessages);

// Send a new message
router.post("/", protect, sendMessage);

// Mark messages from a specific sender as read
router.put("/:senderId/read", protect, markAsRead);

// Get unread message count
router.get("/unread/count", protect, getUnreadCount);

export default router;