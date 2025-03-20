import express from "express";
import { body, param } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js";
import {
  getAllHelpRequests,
  createHelpRequest,
  getHelpRequestById,
  updateHelpRequest,
  deleteHelpRequest,
  offerHelp,
  completeHelpRequest,
  getMyHelpRequests
} from "../../controllers/helpRequest/helpRequestController.js";

const router = express.Router();

// Validation middleware for creating/updating help requests
const validateHelpRequest = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("category").isIn(["Childcare", "Repairs", "Home Assistance", "Medical", "Transportation", "Groceries", "Other"])
    .withMessage("Invalid category"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("urgency").optional().isIn(["low", "medium", "high"])
    .withMessage("Urgency must be low, medium, or high")
];

// Validation middleware for ID parameters
const validateRequestId = [
  param("id").isMongoId().withMessage("Invalid help request ID format")
];

// Public routes
router.get("/", getAllHelpRequests);
router.get("/:id", validateRequestId, getHelpRequestById);

// Protected routes that require authentication
router.post("/", protect, validateHelpRequest, createHelpRequest);
router.put("/:id", protect, validateRequestId, validateHelpRequest, updateHelpRequest);
router.delete("/:id", protect, validateRequestId, deleteHelpRequest);

// Special actions
router.put("/:id/offer-help", protect, validateRequestId, offerHelp);
router.put("/:id/complete", protect, validateRequestId, completeHelpRequest);

// User's own requests
router.get("/user/my-requests", protect, getMyHelpRequests);

export default router;
