const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const helpRequestController = require("../controllers/helpRequestController"); 

// ✅ Debugging Log - check if controller is properly loaded
console.log("HelpRequest Controller Loaded:", helpRequestController);

// ✅ Ensure functions exist before assigning routes
if (!helpRequestController.createHelpRequest) {
  throw new Error("Error: helpRequestController.createHelpRequest is undefined");
}

// Define Routes
router.post("/", protect, helpRequestController.createHelpRequest);
router.get("/", helpRequestController.getAllHelpRequests);
router.get("/:id", helpRequestController.getHelpRequestById);
router.put("/:id", protect, helpRequestController.updateHelpRequest);
router.delete("/:id", protect, helpRequestController.deleteHelpRequest);

module.exports = router;
