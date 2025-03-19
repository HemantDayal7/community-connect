import express from "express";
import { body, param } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js";
import {
  createSkillReview,
  getUserSkillReviews,
  getPendingSkillReviews,
  getSkillReviews
} from "../../controllers/skill/skillReviewController.js";

const router = express.Router();

// Validation middleware
const validateReview = [
  body("requestId").isMongoId().withMessage("Invalid request ID"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1-5"),
  body("comment").optional().isString().withMessage("Comment must be a string")
];

// Create a skill review
router.post("/", protect, validateReview, createSkillReview);

// Get reviews for a user
router.get("/user/:userId", param("userId").isMongoId(), getUserSkillReviews);

// Get pending reviews for the logged-in user
router.get("/pending", protect, getPendingSkillReviews);

// Get reviews for a specific skill
router.get("/skill/:skillId", param("skillId").isMongoId(), getSkillReviews);

export default router;