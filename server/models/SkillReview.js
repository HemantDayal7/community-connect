import mongoose from "mongoose";

const SkillReviewSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillRequest",
      required: true
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillSharing",
      required: true
    },
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    reviewerRole: {
      type: String,
      enum: ["requester", "provider"],
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure one reviewer can only review once per request
SkillReviewSchema.index({ requestId: 1, reviewerId: 1 }, { unique: true });

const SkillReview = mongoose.model("SkillReview", SkillReviewSchema);

export default SkillReview;