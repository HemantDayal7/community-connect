import express from "express";
import { body, param } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js";
import {
  createReview,
  getUserReviews,
  getPendingReviews
} from "../../controllers/review/reviewController.js";

const router = express.Router();

// Validation middleware
const validateReview = [
  body("transactionId").isMongoId().withMessage("Invalid transaction ID"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1-5"),
  body("comment").optional().isString().withMessage("Comment must be a string")
];

// Create a review
router.post("/", protect, validateReview, createReview);

// Get reviews for a user
router.get("/user/:userId", param("userId").isMongoId(), getUserReviews);

// Get pending reviews for the logged-in user
router.get("/pending", protect, getPendingReviews);

export default router;