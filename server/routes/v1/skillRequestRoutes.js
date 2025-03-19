import express from "express";
import { body, param } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js";
import {
  createSkillRequest,
  respondToSkillRequest,
  completeSkillRequest,
  getUserSkillRequests
} from "../../controllers/skill/skillRequestController.js";

const router = express.Router();

// Validation middleware
const validateSkillRequest = [
  body("skillId").isMongoId().withMessage("Valid skillId is required"),
  body("message").optional().trim().isString().withMessage("Message must be a string")
];

const validateRequestId = [
  param("id").isMongoId().withMessage("Invalid request ID format")
];

// Get all skill requests for the authenticated user (as provider or requester)
router.get("/", protect, getUserSkillRequests);

// Create a new skill request
router.post("/", protect, validateSkillRequest, createSkillRequest);

// Respond to a skill request (accept/reject)
router.put("/:id/respond", 
  protect,
  validateRequestId,
  body("status").isIn(["accepted", "rejected"]).withMessage("Status must be 'accepted' or 'rejected'"),
  respondToSkillRequest
);

// Mark a request as completed (by requester)
router.put("/:id/complete", protect, validateRequestId, completeSkillRequest);

export default router;