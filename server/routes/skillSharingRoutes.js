const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createSkillSharing,
  getAllSkillSharings,
  getSkillSharingById,
  updateSkillSharing,
  deleteSkillSharing
} = require("../controllers/skillSharingController");

const router = express.Router();

// ✅ Create a new skill-sharing entry
router.post("/", protect, createSkillSharing);

// ✅ Get all skill-sharing entries
router.get("/", protect, getAllSkillSharings);

// ✅ Get a specific skill-sharing entry by ID
router.get("/:id", protect, getSkillSharingById);

// ✅ Update a skill-sharing entry
router.put("/:id", protect, updateSkillSharing);

// ✅ Soft delete a skill-sharing entry
router.delete("/:id", protect, deleteSkillSharing);

module.exports = router;
