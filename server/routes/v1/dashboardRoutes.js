import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import Resource from "../../models/Resource.js";
import Event from "../../models/Event.js";
import HelpRequest from "../../models/HelpRequest.js";
import User from "../../models/User.js";
import Message from "../../models/Message.js";
import SkillSharing from "../../models/SkillSharing.js";

const router = express.Router();

// Get dashboard data with proper structure
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get counts for community stats
    const resourceCount = await Resource.countDocuments();
    const eventCount = await Event.countDocuments({ date: { $gte: new Date() } });
    const helpRequestCount = await HelpRequest.countDocuments({ status: { $in: ['pending', 'in-progress'] } });
    const skillCount = await SkillSharing.countDocuments();
    
    // Get pending actions for this user (simplified - adjust based on your models)
    const unreadMessageCount = await Message.countDocuments({ 
      receiverId: userId, 
      read: false 
    });
    
    // Create basic activity list (you can expand this later)
    const recentActivity = [];
    
    // Get basic nearby events
    const nearbyEvents = await Event.find({ date: { $gte: new Date() } })
      .limit(4)
      .sort({ date: 1 })
      .populate("hostId", "name email");
      
    // Get basic help requests
    const helpRequestsNearby = await HelpRequest.find({ 
      status: "pending",
      requesterId: { $ne: userId }
    })
    .limit(3)
    .sort({ createdAt: -1 });
    
    // Get recommended resources
    const recommendedResources = await Resource.find({
      ownerId: { $ne: userId },
      availability: "available"
    })
    .limit(3)
    .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      stats: {
        resources: resourceCount,
        events: eventCount,
        helpRequests: helpRequestCount,
        skillsShared: skillCount
      },
      pendingActions: {
        messages: unreadMessageCount || 0,
        borrowRequests: 0,
        skillRequests: 0,
        helpOffers: 0
      },
      recentActivity,
      nearbyEvents,
      recommendedResources,
      helpRequestsNearby
    });
    
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching dashboard data"
    });
  }
});

export default router;