const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const messageController = require("../controllers/messageController");

// @route    POST /messages
// @desc     Send a new message
router.post("/", protect, messageController.sendMessage);

// @route    GET /messages
// @desc     Get all messages (Admin only or for debugging)
router.get("/", protect, messageController.getAllMessages);

// @route    GET /messages/:userId1/:userId2
// @desc     Get chat between two users
router.get("/:userId1/:userId2", protect, messageController.getMessagesBetweenUsers);

// @route    DELETE /messages/:id
// @desc     Soft delete a message
router.delete("/:id", protect, messageController.deleteMessage);

module.exports = router;
