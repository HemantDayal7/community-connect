import mongoose from "mongoose";

const SkillRequestSchema = new mongoose.Schema(
  {
    skillId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "SkillSharing", 
      required: true 
    },
    requesterId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    providerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    status: { 
      type: String, 
      enum: ["pending", "accepted", "rejected", "completed"], 
      default: "pending" 
    },
    message: { 
      type: String, 
      trim: true 
    },
    // Add these fields to track review status
    requesterReviewed: {
      type: Boolean,
      default: false
    },
    providerReviewed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("SkillRequest", SkillRequestSchema);