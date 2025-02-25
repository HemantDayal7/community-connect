import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    attendeeCount: { type: Number, default: 0 },
    status: { type: String, enum: ["upcoming", "completed", "canceled"], default: "upcoming" },
}, { timestamps: true });

export default mongoose.model("Event", EventSchema);
