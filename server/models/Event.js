import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, // ✅ Index added
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    attendeeCount: { type: Number, default: 0 },
    status: { type: String, enum: ["upcoming", "completed", "canceled"], default: "upcoming" },
}, { timestamps: true });

// ✅ Ensure frequently queried fields are indexed
EventSchema.index({ hostId: 1, date: -1 });

export default mongoose.model("Event", EventSchema);
