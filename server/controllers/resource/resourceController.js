import Resource from "../../models/Resource.js";
import { validationResult } from "express-validator";

/**
 * @desc Create a new resource
 * @route POST /api/v1/resources
 * @access Private
 */
export const createResource = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, ownerId, availability, category, location } = req.body;

    const resource = new Resource({ title, description, ownerId, availability, category, location });
    await resource.save();

    res.status(201).json({
      message: "✅ Resource created successfully",
      resource,
    });
  } catch (error) {
    console.error("🔥 Error creating resource:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Get all resources
 * @route GET /api/v1/resources
 * @access Public
 */
export const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    console.error("🔥 Error fetching all resources:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Get a single resource by ID
 * @route GET /api/v1/resources/:id
 * @access Public
 */
export const getResourceById = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    console.log("🔍 Fetching resource with ID:", req.params.id);

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      console.log("❌ Resource not found");
      return res.status(404).json({ message: "Resource not found" });
    }

    console.log("✅ Resource found:", resource);
    res.json(resource);
  } catch (error) {
    console.error("🔥 Error fetching resource:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Update a resource
 * @route PUT /api/v1/resources/:id
 * @access Private
 */
export const updateResource = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    console.log("🔄 Updating resource with ID:", req.params.id);

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      console.log("❌ Resource not found");
      return res.status(404).json({ message: "Resource not found" });
    }

    Object.assign(resource, req.body);
    await resource.save();

    console.log("✅ Resource updated successfully");
    res.json({
      message: "Resource updated successfully",
      resource,
    });
  } catch (error) {
    console.error("🔥 Error updating resource:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Soft delete a resource
 * @route DELETE /api/v1/resources/:id
 * @access Private
 */
export const deleteResource = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    console.log("🗑 Deleting resource with ID:", req.params.id);

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      console.log("❌ Resource not found");
      return res.status(404).json({ message: "Resource not found" });
    }

    await Resource.findByIdAndDelete(req.params.id);

    console.log("✅ Resource deleted successfully");
    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("🔥 Error deleting resource:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Borrow a resource
 * @route POST /api/v1/resources/borrow
 * @access Private
 */
export const borrowResource = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { resourceId, userId } = req.body;

  try {
    console.log("📥 Borrowing resource:", resourceId, "by user:", userId);

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      console.log("❌ Resource not found");
      return res.status(404).json({ message: "Resource not found" });
    }
    if (resource.availability === "borrowed") {
      return res.status(400).json({ message: "Resource is already borrowed" });
    }

    resource.borrowedBy = userId;
    resource.availability = "borrowed";
    await resource.save();

    console.log("✅ Resource borrowed successfully");
    res.json({
      message: "Resource borrowed successfully",
      resource,
    });
  } catch (error) {
    console.error("🔥 Error borrowing resource:", error.message);
    res.status(500).json({ error: error.message });
  }
};
