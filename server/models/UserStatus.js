import mongoose from "mongoose";

const userStatusSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
});

// Static method to update user online status
userStatusSchema.statics.updateStatus = async function (userId, status) {
    return this.findOneAndUpdate(
        { userId },
        { isOnline: status, lastSeen: status ? Date.now() : new Date() },
        { upsert: true, new: true }
    );
};

export default mongoose.model("UserStatus", userStatusSchema);
