import express from "express";
import { body } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js";
import authController from "../../controllers/auth/authController.js";

const router = express.Router();

// ✅ Validation Middleware
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

// @route    POST /api/v1/auth/register
// @desc     Register a new user
router.post("/register", validateRegister, authController.registerUser);

// @route    POST /api/v1/auth/login
// @desc     Authenticate user & get token
router.post("/login", validateLogin, authController.loginUser);

// @route    GET /api/v1/auth/me
// @desc     Get logged-in user details (Requires Authentication)
router.get("/me", protect, authController.getProfile);

// @route    PUT /api/v1/auth/me
// @desc     Update user profile (Requires Authentication)
router.put("/me", protect, authController.updateProfile);

// @route    POST /api/v1/auth/refresh-token
// @desc     Refresh expired access token
router.post("/refresh-token", authController.refreshToken);

export default router;
