const Resource = require("../models/Resource");

// ✅ Create a new resource
exports.createResource = async (req, res) => {
  const { title, description, ownerId, availability, location } = req.body;
  try {
    const resource = new Resource({ title, description, ownerId, availability, location });
    await resource.save();
    res.status(201).json({
      message: "Resource created successfully",
      resource,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get all resources
exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find({ isDeleted: false });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get a single resource by ID
exports.getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || resource.isDeleted) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update a resource
exports.updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || resource.isDeleted) {
      return res.status(404).json({ message: "Resource not found" });
    }
    Object.assign(resource, req.body);
    await resource.save();
    res.json({
      message: "Resource updated successfully",
      resource,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Soft delete a resource
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    if (resource.isDeleted) {
      return res.status(400).json({ message: "Resource already deleted" });
    }
    resource.isDeleted = true;
    await resource.save();
    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Borrow a resource
exports.borrowResource = async (req, res) => {
  const { resourceId, userId } = req.body;
  try {
    const resource = await Resource.findById(resourceId);
    if (!resource || resource.isDeleted) {
      return res.status(404).json({ message: "Resource not found" });
    }
    if (resource.availability === "borrowed") {
      return res.status(400).json({ message: "Resource is already borrowed" });
    }
    resource.borrowerId = userId;
    resource.availability = "borrowed";
    await resource.save();
    res.json({
      message: "Resource borrowed successfully",
      resource,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
