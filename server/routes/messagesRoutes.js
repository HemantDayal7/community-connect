const express = require("express");
const router = express.Router();
const Message = require("../models/Message"); // Ensure Message model exists

// Send a message
router.post("/", async (req, res) => {
    try {
        const { senderId, receiverId, content } = req.body;
        const newMessage = new Message({ senderId, receiverId, content });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all messages
router.get("/", async (req, res) => {
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get messages between two users
router.get("/:senderId/:receiverId", async (req, res) => {
    try {
        const { senderId, receiverId } = req.params;
        const messages = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a message
router.delete("/:id", async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
        if (!message) return res.status(404).json({ error: "Message not found" });
        res.json({ msg: "Message deleted successfully", message });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
