import HelpRequest from "../../models/HelpRequest.js";
import { validationResult } from "express-validator";

/**
 * @desc Get all help requests (Only non-deleted)
 * @route GET /api/v1/help-requests
 * @access Public
 */
export const getAllHelpRequests = async (req, res) => {
  try {
    const helpRequests = await HelpRequest.find({ isDeleted: false }).populate("requesterId", "name email");
    res.status(200).json({ success: true, helpRequests });
  } catch (error) {
    console.error("🔥 Error fetching help requests:", error.message);
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
    const { title, description, category, location } = req.body;

    const newHelpRequest = new HelpRequest({
      title,
      description,
      category,
      location,
      requesterId: req.user._id,
    });

    await newHelpRequest.save();
    res.status(201).json({ success: true, message: "✅ Help request created successfully", newHelpRequest });
  } catch (error) {
    console.error("🔥 Error creating help request:", error.message);
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
    const helpRequest = await HelpRequest.findById(req.params.id).populate("requesterId", "name email");

    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ success: false, message: "❌ Help request not found" });
    }

    res.status(200).json({ success: true, helpRequest });
  } catch (error) {
    console.error("🔥 Error fetching help request:", error.message);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc Update a help request (Only the owner can update)
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
      return res.status(404).json({ success: false, message: "❌ Help request not found" });
    }

    if (helpRequest.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "🚫 Unauthorized to update this request" });
    }

    Object.assign(helpRequest, req.body);
    await helpRequest.save();

    res.status(200).json({ success: true, message: "✅ Help request updated successfully", helpRequest });
  } catch (error) {
    console.error("🔥 Error updating help request:", error.message);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc Soft delete a help request (Only the owner can delete)
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
      return res.status(404).json({ success: false, message: "❌ Help request not found" });
    }

    if (helpRequest.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "🚫 Unauthorized to delete this request" });
    }

    helpRequest.isDeleted = true;
    await helpRequest.save();

    res.status(200).json({ success: true, message: "✅ Help request deleted successfully" });
  } catch (error) {
    console.error("🔥 Error deleting help request:", error.message);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
