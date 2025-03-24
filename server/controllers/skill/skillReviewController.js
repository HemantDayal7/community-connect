import SkillReview from "../../models/SkillReview.js";
import SkillRequest from "../../models/SkillRequest.js";
import User from "../../models/User.js";
import Notification from "../../models/Notification.js";
import { validationResult } from "express-validator";

/**
 * @desc Create a new skill review
 * @route POST /api/v1/skillreviews
 * @access Private
 */
export const createSkillReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { requestId, rating, comment } = req.body;
    const reviewerId = req.user._id;

    // Find the skill request
    const request = await SkillRequest.findById(requestId)
      .populate("skillId")
      .populate("requesterId", "name")
      .populate("providerId", "name");

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: "Skill request not found" 
      });
    }

    // Check if request is completed
    if (request.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: `Cannot review a request that is not completed. Current status: ${request.status}`
      });
    }

    // Determine if reviewer is requester or provider
    const isRequester = request.requesterId._id.toString() === reviewerId.toString();
    const isProvider = request.providerId._id.toString() === reviewerId.toString();

    if (!isRequester && !isProvider) {
      return res.status(403).json({
        success: false,
        message: "You can only review skill exchanges you were involved in"
      });
    }

    // Determine the user being reviewed
    const reviewedUserId = isRequester 
      ? request.providerId._id 
      : request.requesterId._id;

    // Check if already reviewed
    if (isRequester && request.requesterReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a review for this skill exchange"
      });
    }

    if (isProvider && request.providerReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a review for this skill exchange"
      });
    }

    // Create the review
    const review = new SkillReview({
      requestId,
      skillId: request.skillId._id,
      reviewerId,
      reviewedUserId,
      rating,
      comment,
      reviewerRole: isRequester ? "requester" : "provider"
    });

    await review.save();

    // Update the request to mark it as reviewed
    if (isRequester) {
      request.requesterReviewed = true;
    } else {
      request.providerReviewed = true;
    }
    await request.save();

    // Update user trust score
    const reviewedUser = await User.findById(reviewedUserId);
    
    if (reviewedUser) {
      // Calculate new trust score the same way as in resource reviews
      const totalReviews = reviewedUser.totalReviews || 0;
      const currentScore = reviewedUser.trustScore || 5.0;
      
      // Calculate new trust score
      const newTotalReviews = totalReviews + 1;
      const newTrustScore = ((currentScore * totalReviews) + rating) / newTotalReviews;
      
      // Update the user
      reviewedUser.trustScore = Number(newTrustScore.toFixed(2));
      reviewedUser.totalReviews = newTotalReviews;
      await reviewedUser.save();
    }

    // Defensive check for reviewedUserId
    if (!reviewedUserId) {
      console.error("Missing reviewedUserId for notification. Request:", request._id);
      return res.status(400).json({
        success: false,
        message: "Error creating review - missing recipient information"
      });
    }

    // Create notification
    const notification = new Notification({
      userId: reviewedUserId, // FIXED ✅
      message: `${req.user.name} has left you a review for the skill "${request.skillId.title}"`,
      type: "skill_review",
      link: `/profile`,
      isRead: false
    });

    await notification.save();

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(reviewedUserId.toString()).emit("notification", {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        isRead: false,
        createdAt: notification.createdAt
      });
    }

    // If this is a requester reviewing a provider
    if (!isProvider) {
      await Notification.create({
        userId: request.providerId._id, // Add this missing userId
        type: 'skill_review',
        message: `${req.user.name} left a review on your skill service`,
        link: '/skill-requests'
      });
    } 
    // If this is a provider reviewing a requester
    else {
      await Notification.create({
        userId: request.requesterId._id, // Add this missing userId
        type: 'skill_review',
        message: `${req.user.name} left a review on your skill exchange`,
        link: '/skill-requests'
      });
    }

    // Return the created review
    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    console.error("Error creating skill review:", error);
    res.status(500).json({
      success: false,
      message: "Server error, please try again"
    });
  }
};

/**
 * @desc Get reviews for a specific user as skill provider
 * @route GET /api/v1/skillreviews/user/:userId
 * @access Public
 */
export const getUserSkillReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const reviews = await SkillReview.find({ providerId: userId })
      .populate("reviewerId", "name")
      .populate("skillId", "title")
      .sort("-createdAt");
    
    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error("🔥 Error fetching user skill reviews:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * @desc Get pending skill reviews for the logged-in user
 * @route GET /api/v1/skillreviews/pending
 * @access Private
 */
export const getPendingSkillReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find requests where this user is involved and that are completed but not reviewed yet
    let pendingAsRequester = await SkillRequest.find({
      requesterId: userId,
      requesterReviewed: false,
      status: "completed"
    }).populate("skillId", "title")
      .populate("providerId", "name");
      
    let pendingAsProvider = await SkillRequest.find({
      providerId: userId,
      providerReviewed: false,
      status: "completed"
    }).populate("skillId", "title")
      .populate("requesterId", "name");
    
    // Filter out requests with deleted skills
    pendingAsRequester = pendingAsRequester.filter(request => request.skillId && request.skillId._id);
    pendingAsProvider = pendingAsProvider.filter(request => request.skillId && request.skillId._id);
    
    res.status(200).json({
      success: true,
      pendingAsRequester,
      pendingAsProvider
    });
  } catch (error) {
    console.error("Error fetching pending skill reviews:", error);
    res.status(500).json({
      success: false,
      message: "Server error, please try again"
    });
  }
};

/**
 * @desc Get reviews for a specific skill
 * @route GET /api/v1/skillreviews/skill/:skillId
 * @access Public
 */
export const getSkillReviews = async (req, res) => {
  try {
    const { skillId } = req.params;

    // Check if skill exists
    const skillExists = await SkillSharing.exists({ _id: skillId });
    if (!skillExists) {
      return res.status(404).json({ message: "Skill not found or has been deleted" });
    }

    // Find reviews for the skill
    const skill = await SkillSharing.findById(skillId)
      .populate({
        path: 'reviews.reviewerId',
        select: 'name email profileImage'
      });

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.status(200).json(skill.reviews);
  } catch (error) {
    console.error("Error getting skill reviews:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};