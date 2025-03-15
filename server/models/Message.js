import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    }, 
    recipientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    }, 
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource"
    }
  },
  { timestamps: true }
);

// Add this index to improve performance on conversation queries
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });

// Helper method to get conversation between two users
messageSchema.statics.getConversation = async function(user1Id, user2Id) {
  return this.find({
    $or: [
      { senderId: user1Id, recipientId: user2Id },
      { senderId: user2Id, recipientId: user1Id }
    ]
  })
  .sort({ createdAt: 1 })
  .populate("senderId", "name avatar")
  .populate("recipientId", "name avatar")
  .populate("resourceId", "title image");
};

const Message = mongoose.model("Message", messageSchema);
export default Message;
