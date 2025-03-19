import mongoose from "mongoose";

const SkillSharingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    availability: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
    // Add bookedBy field to track who has the skill currently
    bookedBy: { 
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      requestId: { type: mongoose.Schema.Types.ObjectId, ref: "SkillRequest" },
      name: { type: String }
    },
    location: { type: String, required: true, trim: true },
    category: { 
      type: String, 
      trim: true,
      default: "Other",
      enum: ["Technology", "Education", "Arts & Crafts", "Music", "Cooking", 
             "Fitness", "Languages", "Business", "Home Improvement", "Other"]
    },
    rating: { type: Number, default: 5 },
    reviews: [
      {
        reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("SkillSharing", SkillSharingSchema);
