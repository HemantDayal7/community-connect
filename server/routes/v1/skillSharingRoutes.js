import express from "express";
import { protect } from "../../middleware/authMiddleware.js"; // ✅ Ensure correct import path
import {
  getAllSkillSharings,
  createSkillSharing,
  getSkillSharingById,
  updateSkillSharing,
  deleteSkillSharing,
} from "../../controllers/skill/skillSharingController.js"; // ✅ Ensure correct import path

const router = express.Router();

// ✅ Get all skill-sharing listings
router.get("/", getAllSkillSharings);

// ✅ Create a new skill listing (Authentication required)
router.post("/", protect, createSkillSharing);

// ✅ Get a single skill listing by ID
router.get("/:id", getSkillSharingById);

// ✅ Update a skill listing (Only the owner can update)
router.put("/:id", protect, updateSkillSharing);

// ✅ Delete a skill listing (Only the owner can delete)
router.delete("/:id", protect, deleteSkillSharing);

export default router;
