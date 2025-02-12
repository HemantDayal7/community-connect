const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false }
});

// Indexing to optimize queries
MessageSchema.index({ senderId: 1, receiverId: 1, timestamp: 1 });

module.exports = mongoose.model("Message", MessageSchema);
