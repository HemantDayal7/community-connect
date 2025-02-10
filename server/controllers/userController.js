const User = require("../models/User");

// @desc Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc Get a single user
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc Update user details
const updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    Object.assign(user, req.body);
    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc Delete user (soft delete)
const deleteUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.isDeleted = true;
    await user.save();
    res.json({ msg: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// ✅ Ensure correct module.exports
module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
