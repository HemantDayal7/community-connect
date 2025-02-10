const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); // ✅ Fixed Import
const resourceController = require("../controllers/resourceController");

// @route    POST /resources
// @desc     Create a new resource
router.post(
  "/",
  protect,
  [
    check("title", "Title is required").not().isEmpty(),
    check("description", "Description is required").not().isEmpty(),
    check("availability", "Availability is required").not().isEmpty(),
    check("location", "Location is required").not().isEmpty(),
  ],
  resourceController.createResource
);

// @route    GET /resources
// @desc     Get all resources
router.get("/", resourceController.getAllResources);

// @route    GET /resources/:id
// @desc     Get a single resource by ID
router.get("/:id", resourceController.getResourceById);

// @route    PUT /resources/:id
// @desc     Update a resource
router.put("/:id", protect, resourceController.updateResource);

// @route    DELETE /resources/:id
// @desc     Soft delete a resource
router.delete("/:id", protect, resourceController.deleteResource);

module.exports = router;
