const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController"); // ✅ Correct Import

// ✅ Ensure all controller functions exist before using them
console.log("User Controller Loaded:", userController); 

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", protect, userController.updateUser);
router.delete("/:id", protect, userController.deleteUser);

module.exports = router;
