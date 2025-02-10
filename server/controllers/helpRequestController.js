const HelpRequest = require("../models/HelpRequest");

// @desc Create a new help request
const createHelpRequest = async (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const newHelpRequest = new HelpRequest({
      title,
      description,
      category,
      location,
      requesterId: req.user.id,
    });

    await newHelpRequest.save();
    res.status(201).json(newHelpRequest);
  } catch (error) {
    console.error("Error creating help request:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc Get all help requests
const getAllHelpRequests = async (req, res) => {
  try {
    const helpRequests = await HelpRequest.find({ isDeleted: false }).populate("requesterId", "name email");
    res.json(helpRequests);
  } catch (error) {
    console.error("Error fetching help requests:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc Get a help request by ID
const getHelpRequestById = async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id).populate("requesterId", "name email");
    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ msg: "Help request not found" });
    }
    res.json(helpRequest);
  } catch (error) {
    console.error("Error fetching help request:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc Update a help request
const updateHelpRequest = async (req, res) => {
  try {
    let helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ msg: "Help request not found" });
    }

    if (helpRequest.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    helpRequest = await HelpRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(helpRequest);
  } catch (error) {
    console.error("Error updating help request:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc Delete a help request (Soft delete)
const deleteHelpRequest = async (req, res) => {
  try {
    let helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ msg: "Help request not found" });
    }

    if (helpRequest.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    helpRequest.isDeleted = true;
    await helpRequest.save();
    res.json({ msg: "Help request deleted" });
  } catch (error) {
    console.error("Error deleting help request:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// ✅ Ensure all functions are exported properly
module.exports = {
  createHelpRequest,
  getAllHelpRequests,
  getHelpRequestById,
  updateHelpRequest,
  deleteHelpRequest,
};
