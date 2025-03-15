import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // ✅ NO need for extra index
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    trustScore: { 
      type: Number, 
      default: 5.0, 
      min: 1, 
      max: 5 
    }, // Reputation system
    totalReviews: { 
      type: Number, 
      default: 0 
    },
    reviews: [
      {
        reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isVerified: { type: Boolean, default: false }, // Email verification
  },
  { timestamps: true }
);

// ✅ DO NOT ADD `schema.index({ email: 1 })` again. It's already indexed due to `unique: true`.

export default mongoose.model("User", UserSchema);
