import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { validationResult } from "express-validator";
import Resource from "../../models/Resource.js";
import HelpRequest from "../../models/HelpRequest.js";
import SkillSharing from "../../models/SkillSharing.js";
import Event from "../../models/Event.js";
import Message from "../../models/Message.js";

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

    // Fix: Use _id instead of id for consistency
    const user = await User.findById(req.user._id).select("-password");

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

// No changes needed here - just confirming the implementation is correct

const searchUsers = async (req, res) => {
  console.log("🔍 Search query received:", req.query);
  try {
    const { search } = req.query;
    
    if (!search || search.trim().length < 2) {
      console.log("⚠️ Search term too short or missing");
      return res.json([]);
    }
    
    console.log(`🔍 Searching for users with term: "${search}"`);
    
    // Find users that match the search term (case insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ],
      _id: { $ne: req.user._id }
    })
    .select("_id name email profilePicture")
    .limit(10);
    
    console.log(`✅ Found ${users.length} matching users`);
    return res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error searching users:", error);
    return res.status(500).json({ message: "Server error while searching users" });
  }
};

// Add this function to your userController
const getUserActivity = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching activity for user: ${userId}`);
    
    // Make sure we have a valid userId
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required" 
      });
    }
    
    // Wrap each query in a try/catch to prevent one failing query from breaking everything
    let resources = [], helpRequests = [], skills = [], events = [], messages = [];
    
    try {
      resources = await Resource.find({ ownerId: userId })
        .sort({ createdAt: -1 })
        .limit(5);
    } catch (err) {
      console.error("Error fetching resources:", err);
    }
    
    try {
      helpRequests = await HelpRequest.find({ 
        $or: [{ requesterId: userId }, { helperId: userId }] 
      })
        .sort({ createdAt: -1 })
        .limit(5);
    } catch (err) {
      console.error("Error fetching help requests:", err);
    }
    
    try {
      skills = await SkillSharing.find({ userId: userId })
        .sort({ createdAt: -1 })
        .limit(5);
    } catch (err) {
      console.error("Error fetching skills:", err);
    }
    
    try {
      events = await Event.find({
        $or: [{ hostId: userId }, { attendees: userId }]
      })
        .sort({ createdAt: -1 })
        .limit(5);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
    
    try {
      messages = await Message.find({ senderId: userId })
        .sort({ createdAt: -1 })
        .limit(5);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
    
    // Format activities (your existing code looks good)
    const activities = [
      // Format resources as activities
      ...resources.map(resource => ({
        type: 'resource',
        description: `Shared a resource: ${resource.title}`,
        timestamp: resource.createdAt,
        resourceId: resource._id,
        icon: '📦'
      })),
      
      // Format help requests as activities
      ...helpRequests.map(help => ({
        type: 'help',
        description: help.requesterId?.toString() === userId 
          ? `Requested help: ${help.title}` 
          : `Offered to help with: ${help.title}`,
        timestamp: help.createdAt,
        helpId: help._id,
        icon: '🤝'
      })),
      
      // Format skills as activities
      ...skills.map(skill => ({
        type: 'skill',
        description: `Offered skill: ${skill.title}`,
        timestamp: skill.createdAt,
        skillId: skill._id,
        icon: '🎓'
      })),
      
      // Format events as activities
      ...events.map(event => ({
        type: 'event',
        description: event.hostId?.toString() === userId 
          ? `Hosted event: ${event.title}` 
          : `RSVP'd to event: ${event.title}`,
        timestamp: event.createdAt,
        eventId: event._id,
        icon: '📅'
      })),
      
      // Format messages as activities
      ...messages.map(message => ({
        type: 'message',
        description: `Sent a message to another user`,
        timestamp: message.createdAt,
        icon: '💬'
      }))
    ];
    
    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return res.status(200).json({ 
      success: true,
      activities: activities.slice(0, 10) // Limit to 10 most recent
    });
    
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching user activity",
      error: error.message
    });
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
  searchUsers,
  getUserActivity
};
