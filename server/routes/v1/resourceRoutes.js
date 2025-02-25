import express from "express";
import { check } from "express-validator";
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

/**
 * @route   POST /api/v1/resources
 * @desc    Create a new resource
 * @access  Private
 */
router.post(
  "/",
  protect,
  [
    check("title", "Title is required").not().isEmpty(),
    check("description", "Description is required").not().isEmpty(),
    check("availability", "Availability is required").not().isEmpty(),
    check("category", "Category is required").not().isEmpty(),
    check("location", "Location is required").not().isEmpty(),
  ],
  createResource
);

/**
 * @route   GET /api/v1/resources
 * @desc    Get all resources
 * @access  Public
 */
router.get("/", getAllResources);

/**
 * @route   GET /api/v1/resources/:id
 * @desc    Get a single resource by ID
 * @access  Public
 */
router.get("/:id", getResourceById);

/**
 * @route   PUT /api/v1/resources/:id
 * @desc    Update a resource
 * @access  Private
 */
router.put("/:id", protect, updateResource);

/**
 * @route   DELETE /api/v1/resources/:id
 * @desc    Delete a resource
 * @access  Private
 */
router.delete("/:id", protect, deleteResource);

/**
 * @route   POST /api/v1/resources/borrow
 * @desc    Borrow a resource
 * @access  Private
 */
router.post("/borrow", protect, borrowResource);

export default router;
