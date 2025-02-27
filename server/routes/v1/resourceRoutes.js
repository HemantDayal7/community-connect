import express from "express";
import { body, param } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js";
import {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
  borrowResource,
} from "../../controllers/resource/resourceController.js";

const router = express.Router();

// ✅ Validation Middleware
const validateResource = [
  body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("availability")
    .isIn(["available", "borrowed"])
    .withMessage("Availability must be 'available' or 'borrowed'"),
  body("category").notEmpty().withMessage("Category is required"),
  body("location").notEmpty().withMessage("Location is required"),
];

const validateResourceId = [
  param("id").isMongoId().withMessage("Invalid Resource ID format"),
];

// @route    POST /api/v1/resources
// @desc     Create a new resource
router.post("/", protect, validateResource, createResource);

// @route    GET /api/v1/resources
// @desc     Get all resources
router.get("/", getAllResources);

// @route    GET /api/v1/resources/:id
// @desc     Get a single resource by ID
router.get("/:id", validateResourceId, getResourceById);

// @route    PUT /api/v1/resources/:id
// @desc     Update a resource
router.put("/:id", protect, validateResourceId, updateResource);

// @route    DELETE /api/v1/resources/:id
// @desc     Delete a resource
router.delete("/:id", protect, validateResourceId, deleteResource);

// @route    POST /api/v1/resources/borrow
// @desc     Borrow a resource
router.post("/borrow", protect, borrowResource);

export default router;
