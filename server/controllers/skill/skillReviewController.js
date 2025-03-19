import SkillReview from "../../models/SkillReview.js";
import SkillRequest from "../../models/SkillRequest.js";
import User from "../../models/User.js";
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
      .populate("skillId", "title");
    
    if (!request) {
      return res.status(404).json({ message: "Skill request not found" });
    }

    // Verify request is completed
    if (request.status !== "completed") {
      return res.status(400).json({ 
        message: "You can only review after the skill exchange is completed" 
      });
    }

    // Check if user is part of this request
    const isRequester = request.requesterId.toString() === reviewerId.toString();
    const isProvider = request.providerId.toString() === reviewerId.toString();

    if (!isRequester && !isProvider) {
      return res.status(403).json({ 
        message: "You are not authorized to review this skill exchange" 
      });
    }

    // Determine who is being reviewed
    const reviewedUserId = isRequester ? request.providerId : request.requesterId;
    
    // Check if user has already reviewed this request
    if ((isRequester && request.requesterReviewed) || 
        (isProvider && request.providerReviewed)) {
      return res.status(400).json({ message: "You have already reviewed this skill exchange" });
    }

    // Create the review
    const review = new SkillReview({
      reviewerId,
      providerId: request.providerId,
      skillId: request.skillId,
      requestId,
      rating,
      comment
    });

    await review.save();

    // Update request to mark as reviewed
    if (isRequester) {
      request.requesterReviewed = true;
    } else {
      request.providerReviewed = true;
    }
    await request.save();

    // Update the reviewed user's trust score
    const reviewedUser = await User.findById(reviewedUserId);
    const totalReviews = reviewedUser.totalReviews || 0;
    const currentScore = reviewedUser.trustScore || 5.0;
    
    // Calculate new trust score
    const newTotalReviews = totalReviews + 1;
    const newTrustScore = ((currentScore * totalReviews) + rating) / newTotalReviews;
    
    // Update the user
    reviewedUser.trustScore = Number(newTrustScore.toFixed(2));
    reviewedUser.totalReviews = newTotalReviews;
    await reviewedUser.save();

    res.status(201).json({ 
      success: true,
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    console.error("🔥 Error creating skill review:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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
    console.error("🔥 Error fetching pending skill reviews:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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