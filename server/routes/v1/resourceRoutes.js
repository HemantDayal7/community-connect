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
  body("availability").isIn(["available", "borrowed"]).withMessage("Availability must be 'available' or 'borrowed'"),
  body("category").notEmpty().withMessage("Category is required"),
  body("location").notEmpty().withMessage("Location is required"),
];

const validateResourceId = [param("id").isMongoId().withMessage("Invalid Resource ID format")];

// ✅ Routes
router.post("/", protect, validateResource, createResource);
router.get("/", getAllResources);
router.get("/:id", validateResourceId, getResourceById);
router.put("/:id", protect, validateResourceId, updateResource);
router.delete("/:id", protect, validateResourceId, deleteResource);
router.post("/borrow", protect, borrowResource);

export default router;
