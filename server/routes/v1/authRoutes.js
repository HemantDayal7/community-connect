import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import authController from "../../controllers/auth/authController.js"; // ✅ Corrected import

const router = express.Router();

// @route    POST /api/v1/auth/register
// @desc     Register a new user
router.post("/register", authController.registerUser);

// @route    POST /api/v1/auth/login
// @desc     Authenticate user & get token
router.post("/login", authController.loginUser);

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
