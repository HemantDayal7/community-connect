const Resource = require("../models/Resource");

// List of allowed availability values
const validAvailability = ["available", "not available", "unavailable"];

// @desc     Create a new resource
const createResource = async (req, res) => {
  try {
    const { title, description, availability, location } = req.body;

    // Validate input
    if (!title || !description || !availability || !location) {
      return res.status(400).json({ msg: "All fields (title, description, availability, location) are required." });
    }

    if (!validAvailability.includes(availability)) {
      return res.status(400).json({ msg: `Invalid availability status. Choose from: ${validAvailability.join(", ")}` });
    }

    const newResource = new Resource({
      title,
      description,
      availability,
      location,
      ownerId: req.user.id,
    });

    await newResource.save();
    res.status(201).json(newResource);
  } catch (error) {
    console.error("Error creating resource:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc     Get all resources
const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find({ isDeleted: false })
      .populate("ownerId", "name email")
      .lean();
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc     Get a single resource by ID
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate("ownerId", "name email")
      .lean();
    
    if (!resource || resource.isDeleted) {
      return res.status(404).json({ msg: "Resource not found" });
    }

    res.json(resource);
  } catch (error) {
    console.error("Error fetching resource:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc     Update a resource
const updateResource = async (req, res) => {
  try {
    let resource = await Resource.findById(req.params.id);
    if (!resource || resource.isDeleted) {
      return res.status(404).json({ msg: "Resource not found" });
    }

    if (resource.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    // Validate availability if provided
    if (req.body.availability && !validAvailability.includes(req.body.availability)) {
      return res.status(400).json({ msg: `Invalid availability status. Choose from: ${validAvailability.join(", ")}` });
    }

    resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(resource);
  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc     Delete a resource (Soft delete)
const deleteResource = async (req, res) => {
  try {
    let resource = await Resource.findById(req.params.id);
    if (!resource || resource.isDeleted) {
      return res.status(404).json({ msg: "Resource not found" });
    }

    if (resource.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    resource.isDeleted = true;
    await resource.save();
    res.json({ msg: "Resource deleted successfully" });
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// ✅ **Ensure proper module exports**
module.exports = {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
};
