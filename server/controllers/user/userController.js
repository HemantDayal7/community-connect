import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { validationResult } from "express-validator";

dotenv.config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ✅ Register a new user
const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isDeleted: false,
    });

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ Login user
const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    if (user.isDeleted) {
      return res.status(403).json({ msg: "User account is deactivated." });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ Get user profile
const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "Unauthorized: No user found in request" });
    }

    const user = await User.findById(req.user.id).select("-password");

    if (!user || user.isDeleted) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ Update user profile
const updateUserProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ msg: "Unauthorized: No user found in request" });
    }

    const user = await User.findById(req.user.id);

    if (!user || user.isDeleted) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.save();

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ Get user by ID
const getUserById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user || user.isDeleted) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ Delete user (soft delete)
const deleteUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "Unauthorized: No user found in request" });
    }

    let user = await User.findById(req.params.id);

    if (!user || user.isDeleted) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    user.isDeleted = true;
    await user.save();

    res.json({ msg: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: { $ne: true } }).select("name email _id");
    
    if (!users.length) {
      return res.status(404).json({ msg: "No users found." });
    }

    res.json(users);
  } catch (error) {
    console.error("🔥 Error in getAllUsers:", error);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ Export all functions once at the bottom
export {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserById,
  deleteUser,
  getAllUsers,
};
