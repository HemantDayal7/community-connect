import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    }, 
    receiverId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    }, 
    content: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false }, // ✅ New field to track read status
    messageType: { 
      type: String, 
      enum: ["text", "image", "video", "file"], 
      default: "text" 
    }, // ✅ New field to support different message types
  },
  { timestamps: true }
);

// ✅ Ensure messages are indexed properly for fast queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

// ✅ Static method to get conversation history
messageSchema.statics.getMessagesBetweenUsers = async function (user1, user2) {
  return this.find({
    $or: [
      { senderId: user1, receiverId: user2 },
      { senderId: user2, receiverId: user1 }
    ],
    isDeleted: false
  }).sort({ createdAt: 1 });
};

// ✅ Method to mark messages as read
messageSchema.methods.markAsRead = async function () {
  this.isRead = true;
  return this.save();
};

export default mongoose.model("Message", messageSchema);
