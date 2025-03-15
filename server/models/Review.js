import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  reviewerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  reviewedUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  transactionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Transaction",
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resource",
    required: true
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    required: true 
  },
  comment: { 
    type: String
  }
}, { timestamps: true });

export default mongoose.model("Review", ReviewSchema);