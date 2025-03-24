import express from "express";
import { body, param } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js";
import {
  getAllSkillSharings,
  createSkillSharing,
  getSkillSharingById,
  updateSkillSharing,
  deleteSkillSharing,
  getUserSkillRequests as getSkillRequests,  // Use the correct name with alias
  updateSkillSettings,
} from "../../controllers/skill/skillSharingController.js";

const router = express.Router();

// ✅ Validation Middleware
const validateSkillSharing = [
  body("title").notEmpty().withMessage("Skill title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("location").notEmpty().withMessage("Location is required"),
  body("availability")
    .isIn(["available", "unavailable"])
    .withMessage("Availability must be 'available' or 'unavailable'"),
  body("category").optional().isString().withMessage("Category must be a string"),
];

const validateSkillId = [
  param("id").isMongoId().withMessage("Invalid Skill ID format"),
];

// ✅ Get all skill-sharing listings
router.get("/", getAllSkillSharings);

// ✅ Create a new skill listing (Protected)
router.post("/", protect, validateSkillSharing, createSkillSharing);

// ✅ Get a single skill listing by ID
router.get("/:id", validateSkillId, getSkillSharingById);

// ✅ Update a skill listing (Only owner can update)
router.put("/:id", protect, validateSkillId, updateSkillSharing);

// ✅ Delete a skill listing (Only owner can delete)
router.delete("/:id", protect, validateSkillId, deleteSkillSharing);

// ✅ Get skill requests for a specific skill listing
router.get("/:id/requests", protect, validateSkillId, getSkillRequests);

// ✅ Update skill settings (like allowMultipleStudents)
router.put("/:id/settings", protect, validateSkillId, updateSkillSettings);

export default router;
