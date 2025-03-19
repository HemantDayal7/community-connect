import mongoose from "mongoose";

const SkillReviewSchema = new mongoose.Schema({
  reviewerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  providerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  skillId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "SkillSharing",
    required: true
  },
  requestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "SkillRequest",
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

export default mongoose.model("SkillReview", SkillReviewSchema);