import express from "express";
import * as authController from "../../controllers/auth/authController.js";
import { protect } from "../../middleware/authMiddleware.js"; // Fixed import

const router = express.Router();

// Public routes
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logoutUser);

// Protected routes
router.get("/me", protect, authController.getProfile); // Using protect instead of auth
router.put("/profile", protect, authController.updateProfile); // Using protect instead of auth

export default router;
