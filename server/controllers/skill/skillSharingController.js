import mongoose from "mongoose";
import SkillSharing from "../../models/SkillSharing.js";
import SkillRequest from "../../models/SkillRequest.js"; 
import Notification from "../../models/Notification.js";
import { validationResult } from "express-validator";

/**
 * @desc Get all skill-sharing listings
 * @route GET /api/v1/skillsharings
 * @access Public
 */
export const getAllSkillSharings = async (req, res) => {
  try {
    // Get all skills with populated user info including trust score
    const skills = await SkillSharing.find().populate("userId", "name email trustScore totalReviews");
    
    // Add average rating and review count for each skill
    const enrichedSkills = await Promise.all(skills.map(async (skill) => {
      const skillObj = skill.toObject();
      
      // Calculate average rating if there are reviews
      if (skill.reviews && skill.reviews.length > 0) {
        const totalRating = skill.reviews.reduce((sum, review) => sum + review.rating, 0);
        skillObj.averageRating = (totalRating / skill.reviews.length).toFixed(1);
        skillObj.reviewsCount = skill.reviews.length;
      } else {
        skillObj.averageRating = null;
        skillObj.reviewsCount = 0;
      }
      
      return skillObj;
    }));
    
    res.status(200).json(enrichedSkills);
  } catch (error) {
    console.error("🔥 Error fetching skill sharings:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Create a new skill listing
 * @route POST /api/v1/skillsharings
 * @access Private
 */
export const createSkillSharing = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    console.log("📌 Received skill data:", req.body);

    const { title, description, location, availability, category } = req.body;
    // Added category here ^^

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    const skill = new SkillSharing({
      title,
      description,
      location,
      availability,
      category, // Add the category field here
      userId: req.user._id,
    });

    await skill.save();
    res.status(201).json({ message: "✅ Skill listing created successfully", skill });
  } catch (error) {
    console.error("🔥 Error creating skill listing:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Get a single skill listing
 * @route GET /api/v1/skillsharings/:id
 * @access Public
 */
export const getSkillSharingById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const skill = await SkillSharing.findById(req.params.id).populate("userId", "name email");
    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found" });
    }
    res.status(200).json(skill);
  } catch (error) {
    console.error("🔥 Error fetching skill listing:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Update a skill listing (Only owner can update)
 * @route PUT /api/v1/skillsharings/:id
 * @access Private
 */
export const updateSkillSharing = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const skill = await SkillSharing.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found" });
    }

    if (skill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized: You cannot update this skill listing" });
    }

    Object.assign(skill, req.body);
    await skill.save();
    res.status(200).json({ message: "✅ Skill listing updated successfully", skill });
  } catch (error) {
    console.error("🔥 Error updating skill listing:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Delete a skill listing (Only owner can delete)
 * @route DELETE /api/v1/skillsharings/:id
 * @access Private
 */
export const deleteSkillSharing = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if skill exists
    const skill = await SkillSharing.findById(id);
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    
    // Check if user is authorized
    if (skill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this skill" });
    }
    
    // Instead of preventing deletion, handle the active requests
    const activeRequests = await SkillRequest.find({
      skillId: id,
      status: { $in: ["pending", "accepted"] }
    });
    
    if (activeRequests.length > 0) {
      console.log(`Found ${activeRequests.length} active requests for skill ${id}. Cancelling them.`);
      
      // Update all pending requests to declined
      await SkillRequest.updateMany(
        { skillId: id, status: "pending" },
        { 
          status: "declined", 
          statusNote: "Skill was deleted by the provider"
        }
      );
      
      // Update all accepted requests to canceled
      await SkillRequest.updateMany(
        { skillId: id, status: "accepted" },
        { 
          status: "canceled", 
          statusNote: "Skill was deleted by the provider"
        }
      );
      
      // Optionally notify users
      // This is placeholder code - implement your notification logic
      for (const request of activeRequests) {
        try {
          await Notification.create({
            userId: request.requesterId,
            type: "skill_request_response",
            message: `The skill "${skill.title}" you requested has been removed by the provider.`,
            isRead: false
          });
        } catch (notifError) {
          console.error("Failed to create notification:", notifError);
        }
      }
    }
    
    // Delete the skill
    await SkillSharing.findByIdAndDelete(id);
    
    // Mark all related requests' requesterReviewed and providerReviewed as true 
    // so they won't show up in pending reviews
    await SkillRequest.updateMany(
      { skillId: id, status: "completed" },
      { 
        requesterReviewed: true,
        providerReviewed: true,
        statusNote: "Skill was deleted by provider"
      }
    );
    
    res.status(200).json({ 
      message: "Skill deleted successfully", 
      canceledRequests: activeRequests.length 
    });
  } catch (error) {
    console.error("Error deleting skill:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Add this function in your controller
export const getUserSkillRequests = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Count active requests for this skill
    const activeRequests = await SkillRequest.countDocuments({
      skillId: id,
      status: { $in: ["pending", "accepted"] }
    });
    
    res.status(200).json({ activeRequests });
  } catch (error) {
    console.error("Error checking skill requests:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Add this function to the file

/**
 * @desc Update skill settings
 * @route PUT /api/v1/skillsharings/:id/settings
 * @access Private
 */
export const updateSkillSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { allowMultipleStudents } = req.body;
    
    // Find the skill
    const skill = await SkillSharing.findById(id);
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    
    // Check ownership
    if (skill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized: You can only update your own skills" });
    }
    
    // Update the setting
    skill.allowMultipleStudents = allowMultipleStudents;
    await skill.save();
    
    // Return the updated skill
    const updatedSkill = await SkillSharing.findById(id).populate("userId", "name trustScore");
    
    res.status(200).json({ 
      message: "Skill settings updated successfully", 
      skill: updatedSkill 
    });
  } catch (error) {
    console.error("Error updating skill settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

