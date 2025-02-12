const Message = require("../models/Message");

// @desc    Send a new message
// @route   POST /messages
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id; // Ensure sender is authenticated
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: "Receiver and content are required." });
    }

    const message = new Message({
      senderId,
      receiverId,
      content,
      timestamp: new Date(),
    });

    await message.save();
    res.status(201).json({ message: "Message sent successfully", data: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all messages (Admin/debugging only)
// @route   GET /messages
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find({ isDeleted: false })
      .populate("senderId receiverId", "name email");
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all messages between two users
// @route   GET /messages/:userId1/:userId2
exports.getMessagesBetweenUsers = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      isDeleted: false,
    }).sort({ timestamp: 1 }) // Sort by time

    .populate("senderId receiverId", "name email"); // Populate sender & receiver

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Soft delete a message
// @route   DELETE /messages/:id
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    message.isDeleted = true;
    await message.save();

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
