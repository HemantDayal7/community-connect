const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    trustScore: { type: Number, default: 5 }, // Trust rating system
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isDeleted: { type: Boolean, default: false }, // Soft delete
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
