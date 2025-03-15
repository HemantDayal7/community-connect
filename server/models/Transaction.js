import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  resourceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Resource", 
    required: true 
  },
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  borrowerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["ongoing", "returned", "cancelled"], 
    default: "ongoing" 
  },
  borrowedAt: { 
    type: Date, 
    default: Date.now 
  },
  returnedAt: { 
    type: Date 
  },
  ownerReviewed: {
    type: Boolean,
    default: false
  },
  borrowerReviewed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model("Transaction", TransactionSchema);