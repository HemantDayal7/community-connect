import mongoose from "mongoose";

const SkillSharingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true }, // ✅ Changed from skillName to title
    description: { type: String, required: true, trim: true },
    availability: {
      type: String,
      enum: ["available", "unavailable"], // ✅ Ensuring only these two values are allowed
      default: "available",
    },
    location: { type: String, required: true, trim: true },
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
