import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateUserId,
} from "../../middleware/validationMiddleware.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  deleteUser,
} from "../../controllers/user/userController.js";

const router = express.Router();

// ✅ Register a new user
router.post("/signup", validateRegister, registerUser);

// ✅ Authenticate user & get token
router.post("/login", validateLogin, loginUser);

// ✅ Get logged-in user details
router.get("/profile", protect, getUserProfile);

// ✅ Update user profile
router.put("/profile", protect, validateUpdateProfile, updateUserProfile);

// ✅ Get all users (Requires authentication)
router.get("/", protect, getAllUsers);

// ✅ Get user by ID (Requires authentication)
router.get("/:id", protect, validateUserId, getUserById);

// ✅ Soft delete user
router.delete("/:id", protect, validateUserId, deleteUser);

export default router;
