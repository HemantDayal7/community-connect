const mongoose = require("mongoose");

const HelpRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Add indexing for better query performance
HelpRequestSchema.index({ title: 1, category: 1 });

module.exports = mongoose.model("HelpRequest", HelpRequestSchema);
