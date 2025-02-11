const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); 
const skillSharingController = require("../controllers/skillSharingController"); 

// ✅ Make sure these functions exist in `skillSharingController.js`
if (!skillSharingController.getAllSkillSharings) {
  throw new Error("getAllSkillSharings function is missing in skillSharingController.js");
}

// @route    GET /skillsharings
// @desc     Get all skill-sharing listings
router.get("/", skillSharingController.getAllSkillSharings);

// @route    POST /skillsharings
// @desc     Create a new skill listing
router.post("/", protect, skillSharingController.createSkillSharing);

// @route    GET /skillsharings/:id
// @desc     Get a single skill listing
router.get("/:id", skillSharingController.getSkillSharingById);

// @route    PUT /skillsharings/:id
// @desc     Update a skill listing
router.put("/:id", protect, skillSharingController.updateSkillSharing);

// @route    DELETE /skillsharings/:id
// @desc     Delete a skill listing
router.delete("/:id", protect, skillSharingController.deleteSkillSharing);

module.exports = router;
