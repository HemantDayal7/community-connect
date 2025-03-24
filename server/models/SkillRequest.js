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
    message: { 
      type: String, 
      trim: true 
    },
    status: { 
      type: String, 
      enum: ["pending", "accepted", "rejected", "completed", "canceled"], 
      default: "pending" 
    },
    responseMessage: {
      type: String,
      trim: true
    },
    statusNote: {
      type: String,
      trim: true
    },
    respondedAt: Date,
    completedAt: Date,
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