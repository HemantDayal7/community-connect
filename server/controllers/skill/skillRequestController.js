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
export const createSkillRequest = async (req, res) => {
  try {
    const { skillId, message } = req.body;
    const requesterId = req.user._id;

    console.log(`Creating skill request: User ${requesterId} requesting skill ${skillId}`);
    
    // Find the skill
    const skill = await SkillSharing.findById(skillId);
    if (!skill) {
      return res.status(404).json({ 
        success: false, 
        message: "Skill not found" 
      });
    }
    
    // Check if skill is available
    if (skill.availability !== "available") {
      return res.status(400).json({ 
        success: false, 
        message: "This skill is currently unavailable" 
      });
    }
    
    // Check if user is requesting their own skill
    if (skill.userId.toString() === requesterId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: "You cannot request your own skill" 
      });
    }
    
    // Check if there's already a pending request for this skill from this user
    const existingRequest = await SkillRequest.findOne({
      skillId,
      requesterId,
      status: "pending"
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: "You already have a pending request for this skill" 
      });
    }
    
    // Create the request
    const request = new SkillRequest({
      skillId,
      requesterId,
      providerId: skill.userId, // Make sure providerId is set correctly
      message: message || "I'm interested in your skill!"
    });

    await request.save();
    console.log(`✅ New skill request created: ${request._id}, from user ${requesterId} to provider ${skill.userId}`);
    
    // Create notification for the skill provider
    const notification = new Notification({
      userId: skill.userId,  // CHANGE THIS from recipient to userId to match model
      message: `${req.user.name} requested your skill: ${skill.title}`,
      type: "skill_request",
      link: `/skill-requests`,
      isRead: false
    });
    
    await notification.save();
    console.log(`✅ Notification created for provider ${skill.userId}`);
    
    // Send real-time notification if socket is available
    const io = req.app.get('io');
    if (io) {
      io.to(skill.userId.toString()).emit("notification", {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        isRead: false,
        createdAt: notification.createdAt
      });
      console.log(`✅ Real-time notification sent to provider ${skill.userId}`);
    }
    
    res.status(201).json({
      success: true,
      message: "Skill request sent successfully",
      request
    });
  } catch (error) {
    console.error("Error creating skill request:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

/**
 * @desc Respond to a skill request (accept/reject)
 * @route PUT /api/v1/skillrequests/:id/respond
 * @access Private
 */
export const respondToSkillRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { id } = req.params;
    const { status, message } = req.body;
    const providerId = req.user._id;
    
    console.log(`Responding to request ${id} with status ${status}`);
    
    // Find the request with all relevant populated fields
    const request = await SkillRequest.findById(id)
      .populate('skillId')
      .populate('requesterId', 'name email')
      .populate('providerId', 'name email');
    
    if (!request) {
      console.log(`Request not found with ID ${id}`);
      return res.status(404).json({ 
        success: false, 
        message: "Skill request not found" 
      });
    }
    
    console.log(`Found request for skill: ${request.skillId?.title}`);
    console.log(`Request providerId: ${request.providerId?._id}`);
    console.log(`Current user: ${providerId}`);
    
    // Check if current user is the provider
    if (request.providerId && request.providerId._id.toString() !== providerId.toString()) {
      console.log(`Auth error: User ${providerId} is not the provider for this skill`);
      return res.status(403).json({ 
        success: false, 
        message: "You are not authorized to respond to this request" 
      });
    }
    
    // Check if request is already processed
    if (request.status !== 'pending') {
      console.log(`Request already processed. Current status: ${request.status}`);
      return res.status(400).json({
        success: false,
        message: `This request has already been ${request.status}`
      });
    }
    
    // Update request status
    request.status = status;
    request.responseMessage = message || '';
    request.respondedAt = new Date();
    
    // If accepting, update skill availability
    if (status === 'accepted') {
      console.log(`Accepting request. Updating skill availability...`);
      try {
        const skill = await SkillSharing.findById(request.skillId._id);
        
        if (skill) {
          console.log(`Found skill ${skill._id}. Current availability: ${skill.availability}`);
          
          // Update skill availability
          skill.availability = 'unavailable';
          skill.bookedBy = {
            userId: request.requesterId._id,
            requestId: request._id,
            name: request.requesterId.name
          };
          
          await skill.save();
          console.log(`✅ Updated skill availability to unavailable`);
        } else {
          console.log(`⚠️ Skill not found for ID: ${request.skillId._id}`);
        }
      } catch (error) {
        console.error(`Error updating skill availability:`, error);
        // Continue with the request update even if skill update fails
      }
    }
    
    // Save the updated request
    await request.save();
    console.log(`✅ Request ${id} updated successfully to ${status}`);
    
    // Create notification for requester
    const notification = new Notification({
      userId: request.requesterId._id,  // USING userId INSTEAD OF recipient
      message: status === 'accepted' 
        ? `Your request for "${request.skillId.title}" has been accepted!` 
        : `Your request for "${request.skillId.title}" has been declined.`,
      type: status === 'accepted' ? "request_accepted" : "request_declined",
      link: `/skill-requests`,
      isRead: false
    });
    
    await notification.save();
    console.log(`✅ Notification created for requester`);
    
    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(request.requesterId._id.toString()).emit("notification", {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        isRead: false,
        createdAt: notification.createdAt
      });
      console.log(`✅ Real-time notification sent`);
    }
    
    // Return updated request
    const populatedRequest = await SkillRequest.findById(id)
      .populate('skillId')
      .populate('requesterId', 'name email');
    
    return res.status(200).json({
      success: true,
      message: `Request ${status === 'accepted' ? 'accepted' : 'declined'} successfully`,
      request: populatedRequest
    });
  } catch (error) {
    console.error("Error responding to skill request:", error);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
      error: error.message
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
    const { id } = req.params;
    const userId = req.user._id;

    // Find the request
    const request = await SkillRequest.findById(id)
      .populate('skillId')
      .populate('providerId', 'name email')
      .populate('requesterId', 'name email');
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: "Skill request not found" 
      });
    }

    // Allow only requester to complete the request
    if (request.requesterId._id.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Only the requester can mark a skill exchange as completed" 
      });
    }

    // Check if request is in the correct state
    if (request.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: `Cannot complete a request that is ${request.status}`
      });
    }

    // Update the request
    request.status = "completed";
    request.completedAt = new Date();
    await request.save();

    // Update the skill to be available again
    const skill = await SkillSharing.findById(request.skillId._id);
    if (skill) {
      skill.availability = "available";
      skill.bookedBy = null;
      await skill.save();
      console.log(`✅ Skill ${skill._id} set back to available after completion`);
    }

    // Create notification for both parties about review opportunity
    // For provider
    const providerNotification = new Notification({
      userId: request.providerId._id,
      message: `The skill service "${request.skillId.title}" has been marked as completed. You can now leave a review!`,
      type: "skill_completed",
      link: `/skill-requests`,
      isRead: false
    });
    
    await providerNotification.save();
    
    // For requester
    const requesterNotification = new Notification({
      userId: request.requesterId._id,
      message: `Your skill service "${request.skillId.title}" has been marked as completed. You can now leave a review!`,
      type: "skill_completed",
      link: `/skill-requests`,
      isRead: false
    });
    
    await requesterNotification.save();

    // Send real-time notifications if available
    const io = req.app.get('io');
    if (io) {
      io.to(request.providerId._id.toString()).emit("notification", {
        _id: providerNotification._id,
        message: providerNotification.message,
        type: providerNotification.type,
        link: providerNotification.link,
        isRead: false,
        createdAt: providerNotification.createdAt
      });
      
      io.to(request.requesterId._id.toString()).emit("notification", {
        _id: requesterNotification._id,
        message: requesterNotification.message,
        type: requesterNotification.type,
        link: requesterNotification.link,
        isRead: false,
        createdAt: requesterNotification.createdAt
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill exchange marked as completed successfully",
      request: request
    });
  } catch (error) {
    console.error("Error completing skill request:", error);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again"
    });
  }
};

/**
 * @desc Get all requests for the logged-in user (as provider or requester)
 * @route GET /api/v1/skillrequests
 * @access Private
 */
export const getUserSkillRequests = async (req, res) => {
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
      userId: request.requesterId, // FIXED: changed from recipient to userId
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

// Make sure this function is correctly implemented and exported

/**
 * @desc Get pending skill requests for the authenticated user
 * @route GET /api/v1/skillrequests/pending
 * @access Private
 */
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log("Fetching pending requests for user:", userId);
    
    // Find PENDING requests where the current user is the PROVIDER
    const pendingRequests = await SkillRequest.find({
      providerId: userId,
      status: 'pending'
    })
      .populate('skillId', 'title')
      .populate('requesterId', 'name trustScore')
      .sort('-createdAt');
    
    console.log("Found pending requests:", pendingRequests.length);
    
    if (pendingRequests.length > 0) {
      console.log("First pending request:", {
        id: pendingRequests[0]._id,
        skillId: pendingRequests[0].skillId?._id,
        skillTitle: pendingRequests[0].skillId?.title,
        requesterId: pendingRequests[0].requesterId?._id,
        requesterName: pendingRequests[0].requesterId?.name
      });
    }
    
    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error("Error fetching pending skill requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add this function

/**
 * @desc Mark a skill request as completed by skill ID
 * @route PUT /api/v1/skillrequests/complete-by-skill/:skillId
 * @access Private
 */
export const completeSkillRequestBySkillId = async (req, res) => {
  try {
    const { skillId } = req.params;
    const userId = req.user._id;

    // Find the request by skill ID and requester ID
    const request = await SkillRequest.findOne({
      skillId: skillId,
      requesterId: userId,
      status: "accepted"
    })
    .populate('skillId')
    .populate('providerId', 'name email')
    .populate('requesterId', 'name email');
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: "No active accepted request found for this skill" 
      });
    }

    // Update the request
    request.status = "completed";
    request.completedAt = new Date();
    await request.save();

    // Update the skill to be available again
    const skill = await SkillSharing.findById(skillId);
    if (skill) {
      skill.availability = "available";
      skill.bookedBy = null;  // Ensure bookedBy is completely cleared
      await skill.save();
      console.log(`✅ Skill ${skill._id} set back to available after completion`);
    } else {
      console.warn(`⚠️ Skill ${skillId} not found when trying to update availability`);
    }

    // Create notifications (same as in completeSkillRequest function)
    const providerNotification = new Notification({
      userId: request.providerId._id,
      message: `The skill service "${request.skillId.title}" has been marked as completed. You can now leave a review!`,
      type: "skill_completed",
      link: `/skill-requests`,
      isRead: false
    });
    
    await providerNotification.save();
    
    const requesterNotification = new Notification({
      userId: request.requesterId._id,
      message: `Your skill service "${request.skillId.title}" has been marked as completed. You can now leave a review!`,
      type: "skill_completed",
      link: `/skill-requests`,
      isRead: false
    });
    
    await requesterNotification.save();

    // Send real-time notifications
    const io = req.app.get('io');
    if (io) {
      io.to(request.providerId._id.toString()).emit("notification", {
        _id: providerNotification._id,
        message: providerNotification.message,
        type: providerNotification.type,
        link: providerNotification.link,
        isRead: false,
        createdAt: providerNotification.createdAt
      });
      
      io.to(request.requesterId._id.toString()).emit("notification", {
        _id: requesterNotification._id,
        message: requesterNotification.message,
        type: requesterNotification.type,
        link: requesterNotification.link,
        isRead: false,
        createdAt: requesterNotification.createdAt
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill exchange marked as completed successfully",
      request: request
    });
  } catch (error) {
    console.error("Error completing skill request by skill ID:", error);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again"
    });
  }
};

// Around line 835-870 where it handles the addSkillReview function

const addSkillReview = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rating, comment, isProvider } = req.body;
    const userId = req.user._id;

    // Find the skill request
    const request = await SkillRequest.findById(requestId)
      .populate('skillId')
      .populate('requesterId')
      .populate('providerId');
      
    if (!request) {
      return res.status(404).json({ success: false, message: "Skill request not found" });
    }

    // Validate that the user is either the provider or requester
    const isRequester = String(request.requesterId._id) === String(userId);
    const isSkillProvider = String(request.providerId._id) === String(userId);

    if (!isRequester && !isSkillProvider) {
      return res.status(403).json({ 
        success: false, 
        message: "Only the requester or provider can leave a review" 
      });
    }

    // Update the appropriate review field
    if (isProvider && isSkillProvider) {
      request.providerReview = { rating, comment };
      request.providerReviewed = true;
      
      // Create notification for the requester with the proper userId
      await Notification.create({
        userId: request.requesterId._id, // IMPORTANT: This was missing
        type: 'skill_review',
        message: `${req.user.name} left a review on your skill exchange`,
        link: '/skill-requests'
      });
      
    } else if (!isProvider && isRequester) {
      request.requesterReview = { rating, comment };
      request.requesterReviewed = true;
      
      // Create notification for the provider with the proper userId
      await Notification.create({
        userId: request.providerId._id, // IMPORTANT: This was missing
        type: 'skill_review',
        message: `${req.user.name} left a review on your skill service`,
        link: '/skill-requests'
      });
    }

    // Save the updated request
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Review submitted successfully"
    });
  } catch (error) {
    console.error("Error creating skill review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error.message
    });
  }
};
