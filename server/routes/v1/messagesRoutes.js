import express from "express";
import { body, param } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js";
import {
  sendMessage,
  getAllConversations,
  getMessagesBetweenUsers,
  deleteMessage
} from "../../controllers/messaging/messageController.js";

const router = express.Router();

// ✅ Validation Middleware
const validateSendMessage = [
  body("receiverId").notEmpty().withMessage("Receiver ID is required").isMongoId().withMessage("Invalid Receiver ID"),
  body("content").notEmpty().withMessage("Message content is required").trim(),
];

const validateMessageId = [
  param("id").isMongoId().withMessage("Invalid Message ID format"),
];

const validateUserIds = [
  param("userId1").isMongoId().withMessage("Invalid User ID format"),
  param("userId2").isMongoId().withMessage("Invalid User ID format"),
];

// ✅ Send a new message
router.post("/", protect, validateSendMessage, sendMessage);

// ✅ Get all conversations (Inbox preview)
router.get("/", protect, getAllConversations);

// ✅ Get messages between two users (Chat history)
router.get("/:userId1/:userId2", protect, validateUserIds, getMessagesBetweenUsers);

// ✅ Delete a message (Soft delete)
router.delete("/:id", protect, validateMessageId, deleteMessage);

export default router;
