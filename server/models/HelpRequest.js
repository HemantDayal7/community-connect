import mongoose from "mongoose";

const HelpRequestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    helperId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
    isDeleted: { type: Boolean, default: false }, // ✅ Added soft delete flag
}, { timestamps: true });

export default mongoose.model("HelpRequest", HelpRequestSchema);
