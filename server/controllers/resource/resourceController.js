import Resource from "../../models/Resource.js";
import Notification from "../../models/Notification.js";
import Transaction from "../../models/Transaction.js"; // Make sure this is imported
import { validationResult } from "express-validator";
import mongoose from "mongoose";

/**
 * @desc Create a new resource
 * @route POST /api/v1/resources
 * @access Private
 */
export const createResource = async (req, res) => {
  try {
    // Handle file upload
    const image = req.file ? req.file.filename : null;
    
    const resource = new Resource({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      location: req.body.location,
      ownerId: req.user._id,
      image: image,
      availability: "available"
    });
    
    // After the upload middleware processes the file
    if (req.file) {
      // Just store the filename, not the path
      resource.image = req.file.filename; // e.g., "resource-1741953127949-221097098.png"
      
      console.log(`📸 Resource will be saved with image filename: ${req.file.filename}`);
    }
    
    await resource.save();
    
    // Log the saved resource to verify the image path
    console.log(`📁 Resource saved with image: ${resource.image}`);
    
    // Return the resource with populated owner
    const populatedResource = await Resource.findById(resource._id)
      .populate("ownerId", "name trustScore");
      
    res.status(201).json(populatedResource);
  } catch (error) {
    console.error(`❌ Error creating resource: ${error.message}`);
    res.status(500).json({ message: "Failed to create resource", error: error.message });
  }
};

/**
 * @desc Get all resources with search/filter
 * @route GET /api/v1/resources
 * @access Public
 */
export const getAllResources = async (req, res) => {
  try {
    const { q, category, location, availability } = req.query;
    let query = {};

    // Build search query
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }
    
    // Filter by availability
    if (availability) {
      query.availability = availability;
    }

    const resources = await Resource.find(query)
      .populate("ownerId", "name trustScore")
      .populate("borrowedBy", "name trustScore")
      .sort("-createdAt");

    res.status(200).json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get a single resource by ID
 * @route GET /api/v1/resources/:id
 * @access Public
 */
export const getResourceById = async (req, res) => {
  console.log("🔍 Fetching resource with ID:", req.params.id);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    console.log("✅ Resource found:", resource);
    res.status(200).json(resource);
  } catch (error) {
    console.error("🔥 Error fetching resource:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * @desc Update a resource's availability (borrow/return)
 * @route PUT /api/v1/resources/:id
 * @access Private
 */
export const updateResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user._id;
    const { action } = req.body; // 'borrow' or 'return'

    // Find the resource
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // BORROW FLOW
    if (action === 'borrow' && resource.availability === "available") {
      // Check if user is trying to borrow their own resource
      if (resource.ownerId.toString() === userId.toString()) {
        return res.status(400).json({ message: "You cannot borrow your own resource" });
      }

      // Update resource status
      resource.availability = "borrowed";
      resource.borrowedBy = userId;
      
      try {
        // Create a transaction record
        const transaction = new Transaction({
          resourceId: resource._id,
          ownerId: resource.ownerId,
          borrowerId: userId,
          status: "ongoing",
          borrowedAt: new Date()
        });
        
        await transaction.save();
        
        // Create notification for resource owner
        const notification = new Notification({
          userId: resource.ownerId,
          message: `${req.user.name} has borrowed your resource: ${resource.title}`,
          type: "resource_borrowed", 
          resourceId: resource._id,
          createdAt: new Date()
        });
        await notification.save();
        
        // FIXED: Log notification delivery for debugging
        if (req.app.get('io')) {
          const io = req.app.get('io');
          console.log(`📣 Sending notification to user ${resource.ownerId}`);
          io.to(resource.ownerId.toString()).emit("notification", {
            _id: notification._id,
            message: notification.message,
            type: notification.type,
            resourceId: notification.resourceId,
            createdAt: notification.createdAt
          });
        } else {
          console.log("❌ No IO instance available for notification");
        }
      } catch (err) {
        console.error("Error creating transaction/notification:", err);
      }
    } 
    // RETURN FLOW
    else if (action === 'return' && resource.availability === "borrowed") {
      // Check if user is the borrower
      if (!resource.borrowedBy || resource.borrowedBy.toString() !== userId.toString()) {
        return res.status(400).json({ 
          message: "Only the borrower can return this resource" 
        });
      }
      
      // Update resource status
      resource.availability = "available";
      
      try {
        // Update transaction
        const transaction = await Transaction.findOne({
          resourceId: resource._id,
          borrowerId: userId,
          status: "ongoing"
        });
        
        if (transaction) {
          transaction.status = "returned";
          transaction.returnedAt = new Date();
          await transaction.save();
        }
        
        // Create notification for resource owner
        const notification = new Notification({
          userId: resource.ownerId,
          message: `${req.user.name} has returned your resource: ${resource.title}`,
          type: "resource",
          resourceId: resource._id,
        });
        await notification.save();
        
        // Send real-time notification via socket.io
        if (req.app.get('io')) {
          const io = req.app.get('io');
          io.to(resource.ownerId.toString()).emit("notification", {
            _id: notification._id,
            message: notification.message,
            type: notification.type,
            resourceId: notification.resourceId,
            createdAt: notification.createdAt,
          });
        }
      } catch (err) {
        console.error("Error updating transaction/notification:", err);
        // Continue with resource update even if notification fails
      }
      
      resource.borrowedBy = null;
    } else {
      return res.status(400).json({ 
        message: "Invalid action or resource state" 
      });
    }

    await resource.save();

    // Populate the updated resource for response
    const updatedResource = await Resource.findById(resourceId)
      .populate("ownerId", "name trustScore")
      .populate("borrowedBy", "name trustScore");

    res.status(200).json(updatedResource);
  } catch (error) {
    console.error(`🔥 Error updating resource: ${error}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * @desc Delete a resource
 * @route DELETE /api/v1/resources/:id
 * @access Private
 */
export const deleteResource = async (req, res) => {
  console.log("🗑 Deleting resource with ID:", req.params.id);
  console.log("User:", req.user?._id);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      console.log("❌ Resource not found");
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check if the user is authorized to delete this resource
    if (resource.ownerId.toString() !== req.user._id.toString()) {
      console.log("❌ Unauthorized deletion attempt");
      return res.status(403).json({ 
        message: "Unauthorized: You can only delete your own resources" 
      });
    }

    // Check if resource is currently borrowed
    if (resource.availability === "borrowed") {
      console.log("❌ Resource is currently borrowed");
      return res.status(400).json({ 
        message: "Cannot delete a resource that is currently borrowed" 
      });
    }

    await resource.deleteOne();

    console.log("✅ Resource deleted successfully");
    res.status(200).json({ 
      message: "Resource deleted successfully",
      resourceId: req.params.id
    });
  } catch (error) {
    console.error("🔥 Error deleting resource:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * @desc Borrow a resource
 * @route POST /api/v1/resources/borrow
 * @access Private
 */
export const borrowResource = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { resourceId, userId } = req.body;

  try {
    console.log("📥 Borrowing resource:", resourceId, "by user:", userId);

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    if (resource.availability === "borrowed") {
      return res.status(400).json({ message: "Resource is already borrowed" });
    }

    resource.borrowedBy = userId;
    resource.availability = "borrowed";
    await resource.save();

    console.log("✅ Resource borrowed successfully");
    res.status(200).json({ message: "Resource borrowed successfully", resource });
  } catch (error) {
    console.error("🔥 Error borrowing resource:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * @desc Toggle resource availability (borrow/return)
 * @route PUT /api/v1/resources/:id
 * @access Private
 */
export const updateResourceStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // If resource is available and user is trying to borrow
    if (resource.availability === "available") {
      // Check if user is trying to borrow their own resource
      if (resource.ownerId.toString() === userId.toString()) {
        return res.status(400).json({ 
          message: "You cannot borrow your own resource" 
        });
      }

      // Update to borrowed status
      resource.availability = "borrowed";
      resource.borrowedBy = userId;
    } 
    // If resource is borrowed and user is trying to return it
    else if (resource.availability === "borrowed") {
      // Only the borrower can return the resource
      if (resource.borrowedBy.toString() !== userId.toString()) {
        return res.status(400).json({ 
          message: "Only the person who borrowed this resource can return it" 
        });
      }

      // Update to available status
      resource.availability = "available";
      resource.borrowedBy = null;
    }

    await resource.save();
    
    // Populate the updated resource for the response
    const updatedResource = await Resource.findById(id)
      .populate("ownerId", "name")
      .populate("borrowedBy", "name");

    res.status(200).json(updatedResource);
  } catch (error) {
    console.error(`🔥 Error updating resource status: ${error}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Enhanced borrow/return process with improved notifications

export const updateResourceAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'borrow' or 'return'
    const userId = req.user._id;
    
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }
    
    if (action === "borrow") {
      // Check if the resource is available
      if (resource.availability !== "available") {
        return res.status(400).json({ error: "Resource is not available" });
      }
      
      // Check if user is trying to borrow their own resource
      if (resource.ownerId.toString() === userId.toString()) {
        return res.status(400).json({ error: "You cannot borrow your own resource" });
      }
      
      // Update resource status
      resource.availability = "borrowed";
      resource.borrowedBy = userId;
      
      // Create transaction record
      const transaction = new Transaction({
        resourceId: resource._id,
        ownerId: resource.ownerId,
        borrowerId: userId,
        status: "borrowed",
        borrowedAt: new Date()
      });
      
      await transaction.save();
      
      // Create notification for resource owner
      const notification = new Notification({
        userId: resource.ownerId,
        message: `${req.user.name} has borrowed your ${resource.title}`,
        type: "resource_borrowed",
        resourceId: resource._id,
        actionBy: userId
      });
      
      await notification.save();
      
      // Send real-time notification
      const io = req.app.get("io");
      io.to(resource.ownerId.toString()).emit("notification", notification);
      
    } else if (action === "return") {
      // Check if the resource is borrowed
      if (resource.availability !== "borrowed") {
        return res.status(400).json({ error: "Resource is not borrowed" });
      }
      
      // Check if the current user is the borrower
      if (!resource.borrowedBy || resource.borrowedBy.toString() !== userId.toString()) {
        return res.status(403).json({ error: "You can only return resources you've borrowed" });
      }
      
      // Update resource status
      resource.availability = "available";
      
      // Update transaction
      const transaction = await Transaction.findOne({
        resourceId: resource._id,
        borrowerId: userId,
        status: "borrowed"
      });
      
      if (transaction) {
        transaction.status = "returned";
        transaction.returnedAt = new Date();
        await transaction.save();
      }
      
      // Create notification for resource owner
      const notification = new Notification({
        userId: resource.ownerId,
        message: `${req.user.name} has returned your ${resource.title}`,
        type: "resource_returned",
        resourceId: resource._id,
        actionBy: userId
      });
      
      await notification.save();
      
      // Send real-time notification
      const io = req.app.get("io");
      io.to(resource.ownerId.toString()).emit("notification", notification);
      
      // Clear borrower
      resource.borrowedBy = null;
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }
    
    await resource.save();
    
    // Return updated resource with populated fields
    const updatedResource = await Resource.findById(id)
      .populate("ownerId", "name avatar trustScore")
      .populate("borrowedBy", "name avatar trustScore");

    // Emit event for resource update
    const io = req.app.get("io");
    if (io) {
      io.emit("resource-updated", updatedResource);
      console.log("📢 Emitted resource-updated event");
    }
    
    res.json(updatedResource);
  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Add this new function to your resourceController.js file

/**
 * @desc Return a borrowed resource
 * @route PUT /api/v1/resources/return/:id
 * @access Private
 */
export const returnResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user._id;
    
    console.log(`🔄 User ${userId} attempting to return resource ${resourceId}`);
    
    // Find the resource
    const resource = await Resource.findById(resourceId)
      .populate("ownerId", "name trustScore")
      .populate("borrowedBy", "name trustScore");
    
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    // Check if resource is borrowed
    if (resource.availability !== "borrowed") {
      return res.status(400).json({ message: "Resource is not currently borrowed" });
    }
    
    // Handle both object and string ID cases for borrowedBy (improved from second implementation)
    const borrowerId = typeof resource.borrowedBy === 'object' ? 
      resource.borrowedBy._id : resource.borrowedBy;
    
    if (!borrowerId || borrowerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only return resources you have borrowed" });
    }
    
    // Update resource status
    resource.availability = "available";
    resource.borrowedBy = null;
    
    // Add this code to your returnResource function after updating resource status
    // Around line 545-550 after setting resource.borrowedBy = null

    // Create or update transaction record
    let transaction = await Transaction.findOne({
      resourceId: resource._id,
      borrowerId: userId,
      status: "ongoing"
    });

    if (transaction) {
      // Update existing transaction
      transaction.status = "returned";
      transaction.returnedAt = new Date();
      await transaction.save();
      
      console.log("✅ Transaction updated with returned status:", transaction._id);
    } else {
      // Create new transaction record if none exists
      transaction = await Transaction.create({
        resourceId: resource._id,
        borrowerId: userId,
        ownerId: typeof resource.ownerId === 'object' ? resource.ownerId._id : resource.ownerId,
        status: "returned",
        returnedAt: new Date()
      });
      console.log("✅ New transaction created:", transaction._id);
    }
    
    await resource.save();
    
    // Update transaction record if exists
    try {
      const transaction = await Transaction.findOne({
        resourceId: resource._id,
        borrowerId: userId,
        status: "ongoing"
      });
        
      if (transaction) {
        transaction.status = "returned";
        transaction.returnedAt = new Date();
        await transaction.save();
      }
      
      // Create notification for resource owner
      const ownerId = typeof resource.ownerId === 'object' ? 
        resource.ownerId._id : resource.ownerId;
      
      const notification = new Notification({
        userId: ownerId,
        message: `${req.user.name} has returned your resource: ${resource.title}`,
        type: "resource_returned", // Using an existing enum value
        resourceId: resource._id,
        createdAt: new Date()
      });
      await notification.save();
      
      // Real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(ownerId.toString()).emit('notification', {
          _id: notification._id,
          message: notification.message,
          type: notification.type,
          resourceId: notification.resourceId,
          createdAt: notification.createdAt
        });
        
        // Also emit a general resource update event
        io.emit('resource-updated', resource);
      }
    } catch (err) {
      // Log but continue if transaction update fails
      console.error("Error updating transaction:", err);
    }
    
    // Get fully populated resource to return
    const updatedResource = await Resource.findById(resource._id)
      .populate("ownerId", "name trustScore");
      
    console.log("✅ Resource returned successfully");
    return res.status(200).json({ 
      message: "Resource returned successfully", 
      resource: updatedResource,
      transaction: transaction // Include the transaction in the response
    });
    
  } catch (error) {
    console.error("Error returning resource:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
