import HelpRequest from "../../models/HelpRequest.js";

// ✅ Create a new help request
export const createHelpRequest = async (req, res) => {
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
      requesterId: req.user.id, // ✅ Ensure requesterId is the authenticated user
    });

    await newHelpRequest.save();
    res.status(201).json(newHelpRequest);
  } catch (error) {
    console.error("Error creating help request:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// ✅ Get all help requests (Only non-deleted)
export const getAllHelpRequests = async (req, res) => {
  try {
    const helpRequests = await HelpRequest.find({ isDeleted: false }).populate("requesterId", "name email");
    res.json(helpRequests);
  } catch (error) {
    console.error("Error fetching help requests:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// ✅ Get a help request by ID (Only if not deleted)
export const getHelpRequestById = async (req, res) => {
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

// ✅ Update a help request (Only the owner can update)
export const updateHelpRequest = async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ msg: "Help request not found" });
    }

    if (helpRequest.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized to update this request" });
    }

    Object.assign(helpRequest, req.body);
    await helpRequest.save();
    
    res.json({
      msg: "Help request updated successfully",
      helpRequest,
    });
  } catch (error) {
    console.error("Error updating help request:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// ✅ Soft delete a help request (Only the owner can delete)
export const deleteHelpRequest = async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest || helpRequest.isDeleted) {
      return res.status(404).json({ msg: "Help request not found" });
    }

    if (helpRequest.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized to delete this request" });
    }

    helpRequest.isDeleted = true;
    await helpRequest.save();
    
    res.json({ msg: "Help request deleted successfully" });
  } catch (error) {
    console.error("Error deleting help request:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
