import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    availability: { type: String, enum: ["available", "borrowed"], default: "available" },
    category: { type: String, required: true, trim: true }, // ✅ Ensure category is required & trimmed
    location: { type: String, required: true, trim: true }, // ✅ Add location as required
    borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    borrowedUntil: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model("Resource", ResourceSchema);
