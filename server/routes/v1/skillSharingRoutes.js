import express from "express";
import { body, param } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js";
import {
  getAllSkillSharings,
  createSkillSharing,
  getSkillSharingById,
  updateSkillSharing,
  deleteSkillSharing,
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

export default router;
