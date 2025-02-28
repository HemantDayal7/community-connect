import express from "express";
import { body, param } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js";
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

/**
 * ✅ Validation Middleware
 * Ensures input data is valid before processing requests.
 */
const validateRegister = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const validateLogin = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
];

const validateUpdateProfile = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const validateUserId = [param("id").isMongoId().withMessage("Invalid User ID format")];

/**
 * @route    POST /api/v1/users/signup
 * @desc     Register a new user
 * @access   Public
 */
router.post("/signup", validateRegister, registerUser);

/**
 * @route    POST /api/v1/users/login
 * @desc     Authenticate user & get token
 * @access   Public
 */
router.post("/login", validateLogin, loginUser);

/**
 * @route    GET /api/v1/users/profile
 * @desc     Get logged-in user details
 * @access   Private (Requires Authentication)
 */
router.get("/profile", protect, getUserProfile);

/**
 * @route    PUT /api/v1/users/profile
 * @desc     Update user profile
 * @access   Private (Requires Authentication)
 */
router.put("/profile", protect, validateUpdateProfile, updateUserProfile);

/**
 * @route    GET /api/v1/users
 * @desc     Get all users
 * @access   Private (Requires Authentication)
 */
router.get("/", protect, getAllUsers);

/**
 * @route    GET /api/v1/users/:id
 * @desc     Get user by ID
 * @access   Private (Requires Authentication)
 */
router.get("/:id", protect, validateUserId, getUserById);

/**
 * @route    DELETE /api/v1/users/:id
 * @desc     Soft delete user
 * @access   Private (Requires Authentication)
 */
router.delete("/:id", protect, validateUserId, deleteUser);

export default router;
