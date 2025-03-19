import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: { 
      type: String, 
      enum: [
        "message", 
        "resource_created", 
        "resource_returned", 
        "resource_borrowed",
        "borrow_request",
        "request_approved",
        "request_declined",
        "skill_request_response",
        "skill_request",
        "event_rsvp",
        "event_update",
        "event_canceled"
      ], 
      required: true 
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);