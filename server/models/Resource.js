import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    availability: { type: String, enum: ["available", "borrowed"], default: "available" },
    category: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    image: {
        type: String, // URL or path to the image
    },
}, { timestamps: true });

export default mongoose.model("Resource", ResourceSchema);
