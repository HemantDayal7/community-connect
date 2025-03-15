import express from "express";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Get dashboard data
router.get("/", protect, async (req, res) => {
  try {
    // Basic example data - replace with real data from your database
    const stats = {
      resources: 15,
      events: 5,
      helpRequests: 8
    };
    
    const recentActivity = [
      "John shared a new resource: Lawn Mower",
      "Community event scheduled: Neighborhood Cleanup",
      "Sarah requested help with gardening",
      "New skill sharing: Web Development Tutoring"
    ];
    
    res.status(200).json({
      stats,
      recentActivity
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ message: "Error retrieving dashboard data" });
  }
});

export default router;