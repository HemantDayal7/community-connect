const mongoose = require("mongoose");

const SkillSharingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skillName: { type: String, required: true },
    description: { type: String, required: true },
    availability: { type: String, enum: ["available", "not available"], default: "available" }, // Status
    location: { type: String, required: true },
    isDeleted: { type: Boolean, default: false } // Soft delete
  },
  { timestamps: true }
);

module.exports = mongoose.model("SkillSharing", SkillSharingSchema);
