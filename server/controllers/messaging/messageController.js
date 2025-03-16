import mongoose from "mongoose";
import { validationResult } from "express-validator";
import Message from "../../models/Message.js";
import User from "../../models/User.js";

// ✅ Send a new message
export const sendMessage = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "❌ Receiver not found." });
    }

    const message = await Message.create({ senderId, receiverId, content });

    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "name email")
      .populate("receiverId", "name email");

    res.status(201).json({ message: "✅ Message sent successfully.", data: populatedMessage });
  } catch (error) {
    console.error("🔥 Error sending message:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ✅ Get all conversations (Inbox view)
export const getAllConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id); // ✅ Convert to ObjectId

    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
          isDeleted: false
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $gt: ["$senderId", "$receiverId"] },
              then: { senderId: "$receiverId", receiverId: "$senderId" },
              else: { senderId: "$senderId", receiverId: "$receiverId" }
            }
          },
          latestMessage: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$latestMessage" }
      }
    ]);

    res.status(200).json({ success: true, conversations: messages });
  } catch (error) {
    console.error("🔥 Error fetching conversations:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ✅ Get messages between two users (Chat history)
export const getMessagesBetweenUsers = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId1, userId2 } = req.params;

    // ✅ Convert IDs to ObjectId to prevent errors
    const user1 = new mongoose.Types.ObjectId(userId1);
    const user2 = new mongoose.Types.ObjectId(userId2);

    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ],
      isDeleted: false
    })
      .populate("senderId", "name email")
      .populate("receiverId", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("🔥 Error fetching chat history:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ✅ Soft delete a message (Only sender or receiver can delete)
export const deleteMessage = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "❌ Message not found." });
    }

    if (message.senderId.toString() !== req.user.id && message.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ message: "🚫 Unauthorized: You can only delete your own messages." });
    }

    message.isDeleted = true;
    await message.save();

    res.status(200).json({ success: true, message: "✅ Message deleted successfully." });
  } catch (error) {
    console.error("🔥 Error deleting message:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};