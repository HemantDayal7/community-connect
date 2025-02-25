import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    trustScore: { type: Number, default: 5 },  // New field for reputation system
    reviews: [{ 
        reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    isVerified: { type: Boolean, default: false }, // For email verification
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
