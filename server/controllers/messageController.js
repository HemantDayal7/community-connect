const Message = require("../models/Message");

// Send a new message
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  try {
    const message = new Message({ senderId, receiverId, content });
    await message.save();
    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all messages between two users
exports.getMessages = async (req, res) => {
  const { userId1, userId2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
