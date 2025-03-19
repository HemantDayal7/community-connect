import SkillRequest from "../../models/SkillRequest.js";
import SkillSharing from "../../models/SkillSharing.js";
import { validationResult } from "express-validator";
import Notification from "../../models/Notification.js";
import User from "../../models/User.js";

/**
 * @desc Create a new skill request
 * @route POST /api/v1/skillrequests
 * @access Private
 */
const createSkillRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { skillId, message } = req.body;
    const requesterId = req.user._id;

    // Find the skill to get the provider ID
    const skill = await SkillSharing.findById(skillId);
    if (!skill) {
      return res.status(404).json({ success: false, message: "Skill not found" });
    }

    // Check if skill is available
    if (skill.availability !== "available") {
      return res.status(400).json({ success: false, message: "This skill is currently unavailable" });
    }

    // Don't allow requesting your own skill
    if (skill.userId.toString() === requesterId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot request your own skill" });
    }

    // Check if request already exists
    const existingRequest = await SkillRequest.findOne({
      skillId,
      requesterId,
      status: { $in: ["pending", "accepted"] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false, 
        message: "You already have an active request for this skill",
        requestStatus: existingRequest.status
      });
    }

    // Create the request
    const request = new SkillRequest({
      skillId,
      requesterId,
      providerId: skill.userId,
      message: message || "I'm interested in your skill!"
    });

    await request.save();
    
    // Populate the request with user and skill details
    const populatedRequest = await SkillRequest.findById(request._id)
      .populate("skillId", "title")
      .populate("requesterId", "name email")
      .populate("providerId", "name email");

    // Create notification for the skill provider
    const notification = new Notification({
      userId: skill.userId,
      message: `${req.user.name} requested your skill: ${skill.title}`,
      type: "skill_request",  // Use this new type instead of "borrow_request"
      isRead: false,
      resourceId: skill._id  
    });

    await notification.save();

    // Send real-time notification if socket is available
    const io = req.app.get('io');
    if (io) {
      io.to(skill.userId.toString()).emit("notification", {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        isRead: false,
        createdAt: notification.createdAt
      });
    }

    res.status(201).json({
      success: true,
      message: "Skill request created successfully",
      request: populatedRequest
    });
  } catch (error) {
    console.error("Error creating skill request:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error, please try again" 
    });
  }
};

/**
 * @desc Respond to a skill request (accept/reject)
 * @route PUT /api/v1/skillrequests/:id/respond
 * @access Private
 */
const respondToSkillRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status } = req.body;
    const request = await SkillRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Only the skill provider can respond
    if (request.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: Only the skill provider can respond" 
      });
    }

    // Can't change from rejected or completed
    if (request.status === "rejected" || request.status === "completed") {
      return res.status(400).json({ 
        success: false,
        message: `Cannot change status: request is already ${request.status}` 
      });
    }

    // Update status
    request.status = status;
    await request.save();
    
    // Add this block to update skill availability with booker information
    if (status === "accepted") {
      try {
        // Get the requester info
        const requester = await User.findById(request.requesterId);
        
        // Extract the skill ID properly - handles both populated and unpopulated cases
        const skillObjectId = typeof request.skillId === 'object' ? request.skillId._id : request.skillId;
        
        // Update skill with availability and booker info
        const updatedSkill = await SkillSharing.findByIdAndUpdate(
          skillObjectId,
          { 
            availability: "unavailable",
            bookedBy: {
              userId: request.requesterId,
              requestId: request._id,
              name: requester ? requester.name : "Unknown User"
            }
          },
          { new: true } // Return the updated document
        );
        
        console.log("Skill availability updated to:", updatedSkill.availability);
        console.log("Skill booked by:", updatedSkill.bookedBy?.name);
      } catch (err) {
        console.error("Error updating skill availability:", err);
      }
    }
    
    // Populate request details
    const populatedRequest = await SkillRequest.findById(request._id)
      .populate("skillId", "title")
      .populate("requesterId", "name email")
      .populate("providerId", "name email");
      
    // Get skill title
    const skill = await SkillSharing.findById(request.skillId);
    
    // Create notification for the requester
    const notification = new Notification({
      userId: request.requesterId,
      message: `Your request for "${skill.title}" has been ${status}`,
      type: "skill_request_response", // This is in your enum
      isRead: false,
      actionBy: req.user._id
    });
    
    await notification.save();
    
    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(request.requesterId.toString()).emit("notification", {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        isRead: false,
        createdAt: notification.createdAt
      });
    }
    
    return res.status(200).json({ 
      success: true,
      message: `Request ${status} successfully`,
      request: populatedRequest
    });
  } catch (error) {
    console.error("Error responding to skill request:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Server error, please try again", 
    });
  }
};

/**
 * @desc Mark a skill request as completed
 * @route PUT /api/v1/skillrequests/:id/complete
 * @access Private
 */
export const completeSkillRequest = async (req, res) => {
  try {
    // Fix param name to match route definition
    const { id } = req.params;
    
    // Find the request and ensure skillId is populated
    const request = await SkillRequest.findById(id)
      .populate('skillId');
    
    if (!request) {
      return res.status(404).json({ message: "Skill request not found" });
    }
    
    // Validate that the requester is the one completing the request
    if (request.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to complete this request" });
    }
    
    // Update request status
    request.status = "completed";
    await request.save();
    
    // Safely update skill availability and clear booker info
    const skillId = request.skillId._id || request.skillId;
    await SkillSharing.findByIdAndUpdate(
      skillId,
      { 
        availability: "available",
        $unset: { bookedBy: "" } // Remove the bookedBy field
      }
    );
    
    // Create notification for the provider
    await Notification.create({
      recipient: request.providerId,
      type: "skill_request_completed",
      message: `${req.user.name} has marked the skill exchange for "${request.skillId.title}" as completed!`,
      link: `/skill-requests`,
    });
    
    res.status(200).json({ 
      success: true, 
      message: "Skill request marked as completed",
      request
    });
  } catch (error) {
    console.error("Error completing skill request:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Get all requests for the logged-in user (as provider or requester)
 * @route GET /api/v1/skillrequests
 * @access Private
 */
const getUserSkillRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get requests where user is either provider or requester
    const requests = await SkillRequest.find({
      $or: [
        { providerId: userId },
        { requesterId: userId }
      ]
    })
    .populate("skillId", "title description")
    .populate("requesterId", "name email")
    .populate("providerId", "name email")
    .sort({ createdAt: -1 });
    
    res.status(200).json(requests);
  } catch (error) {
    console.error("🔥 Error fetching user requests:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const acceptSkillRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Find the request
    const request = await SkillRequest.findById(requestId)
      .populate('skillId');
    
    if (!request) {
      return res.status(404).json({ message: "Skill request not found" });
    }
    
    // Check if user is the skill provider
    if (request.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }
    
    // Update request status
    request.status = "accepted";
    await request.save();
    
    // AUTO-UPDATE THE SKILL AVAILABILITY TO UNAVAILABLE
    await SkillSharing.findByIdAndUpdate(
      request.skillId._id,
      { availability: "unavailable" }
    );
    
    // Create notification for requester
    await Notification.create({
      userId: request.requesterId,  // CORRECT: use userId not recipient
      type: "skill_request_response",  // CORRECT: use allowed enum value
      message: `Your request for "${request.skillId.title}" has been accepted!`,
      isRead: false
    });
    
    res.status(200).json({ message: "Skill request accepted successfully" });
  } catch (error) {
    console.error("Error accepting skill request:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const rejectSkillRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Find the request
    const request = await SkillRequest.findById(requestId)
      .populate('skillId');
    
    if (!request) {
      return res.status(404).json({ message: "Skill request not found" });
    }
    
    // Check if user is the skill provider
    if (request.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to reject this request" });
    }
    
    // Update request status
    request.status = "rejected";
    await request.save();
    
    // NO NEED TO UPDATE AVAILABILITY - SKILL REMAINS AVAILABLE
    
    // Create notification
    await Notification.create({
      recipient: request.requesterId,
      type: "skill_request_rejected",
      message: `Your request for "${request.skillId.title}" has been declined.`,
      link: `/skill-requests`,
    });
    
    res.status(200).json({ message: "Skill request rejected successfully" });
  } catch (error) {
    console.error("Error rejecting skill request:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getSkillRequests = async (req, res) => {
  try {
    // Get user ID from auth middleware
    const userId = req.user._id;

    // Get all requests where user is provider or requester
    let requests = await SkillRequest.find({
      $or: [{ providerId: userId }, { requesterId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("skillId")
      .populate("requesterId", "name email")
      .populate("providerId", "name email");

    // Clean up orphaned requests - handle deleted skills gracefully
    requests = requests.map(request => {
      if (!request.skillId) {
        // Add a placeholder for deleted skills
        return {
          ...request._doc,
          skillId: {
            _id: "deleted",
            title: "Deleted Skill",
            description: "This skill has been deleted by the provider.",
            location: "N/A"
          }
        };
      }
      return request;
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching skill requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export { 
  createSkillRequest,
  respondToSkillRequest,
  getUserSkillRequests
};
