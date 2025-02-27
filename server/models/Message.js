import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, // ✅ Index added
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, // ✅ Index added
    content: { type: String, required: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// ✅ Ensure messages are indexed properly for fast queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
