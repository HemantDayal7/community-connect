import express from "express";
import { body, param } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js"; 
import {
  createHelpRequest,
  getAllHelpRequests,
  getHelpRequestById,
  updateHelpRequest,
  deleteHelpRequest,
} from "../../controllers/requesthelp/helpRequestController.js"; 

const router = express.Router();

// ✅ Validation Middleware
const validateHelpRequest = [
  body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("location").notEmpty().withMessage("Location is required"),
];

const validateHelpRequestId = [
  param("id").isMongoId().withMessage("Invalid Help Request ID format"),
];

// ✅ Get all help requests (Public)
router.get("/", getAllHelpRequests);

// ✅ Create a new help request (Requires authentication)
router.post("/", protect, validateHelpRequest, createHelpRequest);

// ✅ Get a single help request by ID (Public)
router.get("/:id", validateHelpRequestId, getHelpRequestById);

// ✅ Update a help request (Only the requester can update)
router.put("/:id", protect, validateHelpRequestId, updateHelpRequest);

// ✅ Soft delete a help request (Only the requester can delete)
router.delete("/:id", protect, validateHelpRequestId, deleteHelpRequest);

export default router;
