import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import {
  sendMessage,
  getAllConversations,
  getMessagesBetweenUsers,
  deleteMessage
} from "../../controllers/messaging/messageController.js";

const router = express.Router();

// ✅ Send a new message
router.post("/", protect, sendMessage);

// ✅ Get all conversations (Inbox preview)
router.get("/", protect, getAllConversations);

// ✅ Get messages between two users (Chat history)
router.get("/:userId1/:userId2", protect, getMessagesBetweenUsers);

// ✅ Delete a message (Soft delete)
router.delete("/:id", protect, deleteMessage);

export default router;
