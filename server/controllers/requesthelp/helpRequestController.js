import HelpRequest from "../../models/HelpRequest.js";
import { validationResult } from "express-validator";

// ✅ Get all help requests (Only non-deleted)
export const getAllHelpRequests = async (req, res) => {
  try {
    const helpRequests = await HelpRequest.find({ isDeleted: false }).populate("requesterId", "name email");
    res.status(200).json(helpRequests);
  } catch (error) {
    console.error("🔥 Error fetching help requests:", error.message);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ Create a new help request
export const createHelpRequest = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, category, location } = req.body;

    const newHelpRequest = new HelpRequest({
      title,
      description,
      category,
      location,
      requesterId: req.user.id, // ✅ Ensure requesterId is the authenticated user
    });

    await newHelpRequest.save();
    res.status(201).json({ success: true, message: "✅ Help request created successfully", newHelpRequest });
  } catch (error) {
    console.error("🔥 Error creating help request:", error.message);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ Get a help request by ID (Only if not deleted)
export const getHelpRequestById = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const helpRequest = await HelpRequest.findById(req.params.id).populate("requesterId", "name email");

    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ msg: "❌ Help request not found" });
    }

    res.status(200).json({ success: true, helpRequest });
  } catch (error) {
    console.error("🔥 Error fetching help request:", error.message);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ Update a help request (Only the owner can update)
export const updateHelpRequest = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ msg: "❌ Help request not found" });
    }

    if (helpRequest.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "🚫 Unauthorized to update this request" });
    }

    Object.assign(helpRequest, req.body);
    await helpRequest.save();
    
    res.status(200).json({ success: true, message: "✅ Help request updated successfully", helpRequest });
  } catch (error) {
    console.error("🔥 Error updating help request:", error.message);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ Soft delete a help request (Only the owner can delete)
export const deleteHelpRequest = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ msg: "❌ Help request not found" });
    }

    if (helpRequest.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "🚫 Unauthorized to delete this request" });
    }

    helpRequest.isDeleted = true;
    await helpRequest.save();
    
    res.status(200).json({ success: true, message: "✅ Help request deleted successfully" });
  } catch (error) {
    console.error("🔥 Error deleting help request:", error.message);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};
