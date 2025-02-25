import mongoose from "mongoose";

const SkillSharingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skillName: { type: String, required: true },
    description: { type: String, required: true },
    availability: { type: String, required: true },
    location: { type: String, required: true },
    rating: { type: Number, default: 5 },
    reviews: [{ 
        reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

export default mongoose.model("SkillSharing", SkillSharingSchema);
