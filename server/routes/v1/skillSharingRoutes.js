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
  body("skillName").notEmpty().withMessage("Skill name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("location").notEmpty().withMessage("Location is required"),
  body("availability")
    .isIn(["available", "unavailable"])
    .withMessage("Availability must be 'available' or 'unavailable'"),
];

const validateSkillId = [
  param("id").isMongoId().withMessage("Invalid Skill ID format"),
];

// @route    GET /api/v1/skillsharings
// @desc     Get all skill-sharing listings
router.get("/", getAllSkillSharings);

// @route    POST /api/v1/skillsharings
// @desc     Create a new skill listing (Authentication required)
router.post("/", protect, validateSkillSharing, createSkillSharing);

// @route    GET /api/v1/skillsharings/:id
// @desc     Get a single skill listing by ID
router.get("/:id", validateSkillId, getSkillSharingById);

// @route    PUT /api/v1/skillsharings/:id
// @desc     Update a skill listing (Only the owner can update)
router.put("/:id", protect, validateSkillId, updateSkillSharing);

// @route    DELETE /api/v1/skillsharings/:id
// @desc     Delete a skill listing (Only the owner can delete)
router.delete("/:id", protect, validateSkillId, deleteSkillSharing);

export default router;
