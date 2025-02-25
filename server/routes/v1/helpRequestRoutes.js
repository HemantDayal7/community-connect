import express from "express";
import { protect } from "../../middleware/authMiddleware.js"; // ✅ Fixed import path
import {
  createHelpRequest,
  getAllHelpRequests,
  getHelpRequestById,
  updateHelpRequest,
  deleteHelpRequest,
} from "../../controllers/requesthelp/helpRequestController.js"; // ✅ Fixed import path

const router = express.Router();

// ✅ Get all help requests (Public)
router.get("/", getAllHelpRequests);

// ✅ Create a new help request (Requires authentication)
router.post("/", protect, createHelpRequest);

// ✅ Get a single help request by ID (Public)
router.get("/:id", getHelpRequestById);

// ✅ Update a help request (Only the requester can update)
router.put("/:id", protect, updateHelpRequest);

// ✅ Soft delete a help request (Only the requester can delete)
router.delete("/:id", protect, deleteHelpRequest);

export default router;
