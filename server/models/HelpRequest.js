import mongoose from "mongoose";

const HelpRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { 
      type: String, 
      required: true, 
      enum: ["Childcare", "Repairs", "Home Assistance", "Medical", "Transportation", "Groceries", "Other"] 
    },
    location: { type: String, required: true, trim: true },
    requesterId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    helperId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      default: null 
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "canceled"],
      default: "pending"
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
  },
  { timestamps: true }
);

// Add indexes for frequently queried fields
HelpRequestSchema.index({ category: 1 });
HelpRequestSchema.index({ status: 1 });
HelpRequestSchema.index({ isDeleted: 1 });

export default mongoose.model("HelpRequest", HelpRequestSchema);
