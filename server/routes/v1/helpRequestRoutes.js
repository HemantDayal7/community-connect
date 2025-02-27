import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import {
  validateHelpRequest,
  validateHelpRequestId,
} from "../../middleware/validationMiddleware.js";
import {
  createHelpRequest,
  getAllHelpRequests,
  getHelpRequestById,
  updateHelpRequest,
  deleteHelpRequest,
} from "../../controllers/requesthelp/helpRequestController.js";

const router = express.Router();

// ✅ Get all help requests (Public)
router.get("/", getAllHelpRequests);

// ✅ Create a new help request (Requires authentication)
router.post("/", protect, validateHelpRequest, createHelpRequest);

// ✅ Get a single help request by ID
router.get("/:id", validateHelpRequestId, getHelpRequestById);

// ✅ Update a help request (Only the requester can update)
router.put("/:id", protect, validateHelpRequestId, updateHelpRequest);

// ✅ Soft delete a help request (Only the requester can delete)
router.delete("/:id", protect, validateHelpRequestId, deleteHelpRequest);

export default router;
