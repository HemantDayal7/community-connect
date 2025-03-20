import HelpRequest from "../../models/HelpRequest.js";
import User from "../../models/User.js";
import Notification from "../../models/Notification.js";
import { validationResult } from "express-validator";

/**
 * @desc Get all help requests (excluding deleted ones)
 * @route GET /api/v1/help-requests
 * @access Public
 */
export const getAllHelpRequests = async (req, res) => {
  try {
    // Support filtering and pagination
    const { category, status, page = 1, limit = 10 } = req.query;
    const filter = { isDeleted: false };
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    const skip = (page - 1) * limit;
    
    const helpRequests = await HelpRequest.find(filter)
      .populate("requesterId", "name email trustScore")
      .populate("helperId", "name email trustScore")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await HelpRequest.countDocuments(filter);
    
    res.status(200).json({ 
      success: true, 
      helpRequests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching help requests:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc Create a new help request
 * @route POST /api/v1/help-requests
 * @access Private
 */
export const createHelpRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, description, category, location, urgency } = req.body;

    const newHelpRequest = new HelpRequest({
      title,
      description,
      category,
      location,
      urgency: urgency || "medium",
      requesterId: req.user._id,
    });

    await newHelpRequest.save();
    
    // Populate requester information
    const populatedRequest = await HelpRequest.findById(newHelpRequest._id)
      .populate("requesterId", "name email trustScore");
      
    res.status(201).json({ 
      success: true, 
      message: "Help request created successfully", 
      helpRequest: populatedRequest 
    });
  } catch (error) {
    console.error("Error creating help request:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc Get a help request by ID
 * @route GET /api/v1/help-requests/:id
 * @access Public
 */
export const getHelpRequestById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const helpRequest = await HelpRequest.findById(req.params.id)
      .populate("requesterId", "name email trustScore")
      .populate("helperId", "name email trustScore");

    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ success: false, message: "Help request not found" });
    }

    res.status(200).json({ success: true, helpRequest });
  } catch (error) {
    console.error("Error fetching help request:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc Update a help request
 * @route PUT /api/v1/help-requests/:id
 * @access Private
 */
export const updateHelpRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ success: false, message: "Help request not found" });
    }

    // Check if user is authorized to update
    if (helpRequest.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this request" });
    }
    
    // Don't allow updates if someone is already helping
    if (helpRequest.status !== "pending" && req.body.status !== "canceled") {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot update a request that is already ${helpRequest.status}` 
      });
    }

    // Update allowed fields
    const { title, description, category, location, urgency, status } = req.body;
    
    if (title) helpRequest.title = title;
    if (description) helpRequest.description = description;
    if (category) helpRequest.category = category;
    if (location) helpRequest.location = location;
    if (urgency) helpRequest.urgency = urgency;
    if (status) helpRequest.status = status;
    
    await helpRequest.save();
    
    // Populate updated request
    const updatedRequest = await HelpRequest.findById(req.params.id)
      .populate("requesterId", "name email trustScore")
      .populate("helperId", "name email trustScore");
    
    res.status(200).json({ 
      success: true, 
      message: "Help request updated successfully", 
      helpRequest: updatedRequest 
    });
  } catch (error) {
    console.error("Error updating help request:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc Delete a help request (Soft delete)
 * @route DELETE /api/v1/help-requests/:id
 * @access Private
 */
export const deleteHelpRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ success: false, message: "Help request not found" });
    }

    // Check if user is authorized to delete
    if (helpRequest.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this request" });
    }

    // Soft delete
    helpRequest.isDeleted = true;
    await helpRequest.save();
    
    res.status(200).json({ success: true, message: "Help request deleted successfully" });
  } catch (error) {
    console.error("Error deleting help request:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc Offer help for a request
 * @route PUT /api/v1/help-requests/:id/offer-help
 * @access Private
 */
export const offerHelp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ success: false, message: "Help request not found" });
    }

    // Check if the request is still pending
    if (helpRequest.status !== "pending") {
      return res.status(400).json({ 
        success: false, 
        message: `This request is already ${helpRequest.status}` 
      });
    }

    // A user cannot help their own request
    if (helpRequest.requesterId.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: "You cannot offer help for your own request" 
      });
    }

    // Update the help request
    helpRequest.helperId = req.user._id;
    helpRequest.status = "in-progress";
    await helpRequest.save();
    
    // Create a notification for the requester
    const notification = new Notification({
      userId: helpRequest.requesterId,
      message: `${req.user.name} has offered to help with your request: "${helpRequest.title}"`,
      type: "help_offered",
      isRead: false
    });
    
    await notification.save();
    
    // Send real-time notification if socket is available
    const io = req.app.get('io');
    if (io) {
      io.to(helpRequest.requesterId.toString()).emit("notification", {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        isRead: false,
        createdAt: notification.createdAt
      });
    }
    
    // Populate the updated request
    const updatedRequest = await HelpRequest.findById(req.params.id)
      .populate("requesterId", "name email trustScore")
      .populate("helperId", "name email trustScore");
    
    res.status(200).json({ 
      success: true, 
      message: "You have successfully offered help", 
      helpRequest: updatedRequest 
    });
  } catch (error) {
    console.error("Error offering help:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc Mark a help request as completed
 * @route PUT /api/v1/help-requests/:id/complete
 * @access Private
 */
export const completeHelpRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ success: false, message: "Help request not found" });
    }

    // Only requester can mark as completed
    if (helpRequest.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Only the requester can mark a help request as completed" 
      });
    }

    // Check if request is in progress
    if (helpRequest.status !== "in-progress") {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot complete a request that is ${helpRequest.status}` 
      });
    }

    // Update the help request
    helpRequest.status = "completed";
    await helpRequest.save();
    
    // Create a notification for the helper
    const notification = new Notification({
      userId: helpRequest.helperId,
      message: `${req.user.name} has marked your help on "${helpRequest.title}" as completed. Thank you!`,
      type: "help_completed",
      isRead: false
    });
    
    await notification.save();
    
    // Send real-time notification if socket is available
    const io = req.app.get('io');
    if (io) {
      io.to(helpRequest.helperId.toString()).emit("notification", {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        isRead: false,
        createdAt: notification.createdAt
      });
    }
    
    // Populate the updated request
    const updatedRequest = await HelpRequest.findById(req.params.id)
      .populate("requesterId", "name email trustScore")
      .populate("helperId", "name email trustScore");
    
    res.status(200).json({ 
      success: true, 
      message: "Help request marked as completed", 
      helpRequest: updatedRequest 
    });
  } catch (error) {
    console.error("Error completing help request:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc Get help requests for current user (as requester or helper)
 * @route GET /api/v1/help-requests/my-requests
 * @access Private
 */
export const getMyHelpRequests = async (req, res) => {
  try {
    const { type = "all" } = req.query;
    
    let filter = { isDeleted: false };
    
    // Filter by type (requested, helping, or all)
    if (type === "requested") {
      filter.requesterId = req.user._id;
    } else if (type === "helping") {
      filter.helperId = req.user._id;
    } else {
      // For "all", include both requested and helping
      filter.$or = [
        { requesterId: req.user._id },
        { helperId: req.user._id }
      ];
    }
    
    const helpRequests = await HelpRequest.find(filter)
      .populate("requesterId", "name email trustScore")
      .populate("helperId", "name email trustScore")
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, helpRequests });
  } catch (error) {
    console.error("Error fetching user help requests:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};