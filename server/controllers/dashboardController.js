// Add or update this controller:

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts for community stats
    const resourceCount = await Resource.countDocuments();
    const eventCount = await Event.countDocuments({ date: { $gte: new Date() } });
    const helpRequestCount = await HelpRequest.countDocuments({ status: { $in: ['pending', 'in-progress'] } });
    const skillCount = await Skill.countDocuments();

    // Get pending actions for this user
    const unreadMessageCount = await Message.countDocuments({ 
      receiverId: userId, 
      read: false 
    });
    
    const pendingBorrowRequests = await BorrowRequest.countDocuments({ 
      ownerId: userId, 
      status: 'pending' 
    });
    
    const pendingSkillRequests = await SkillRequest.countDocuments({ 
      skillOwnerId: userId, 
      status: 'pending' 
    });
    
    const pendingHelpOffers = await HelpRequest.countDocuments({ 
      requesterId: userId, 
      status: 'in-progress', 
      helperId: { $exists: true } 
    });

    // Get recent activity
    const recentActivity = await getRecentActivity(userId);

    // Get nearby events (assuming user has location info)
    const userLocation = await User.findById(userId).select('location');
    const nearbyEvents = await getNearbyEvents(userLocation?.location);

    // Get recommended resources based on user's interests or past activity
    const recommendedResources = await getRecommendedResources(userId);
    
    // Get help requests that need attention
    const helpRequestsNearby = await getHelpRequestsNearby(userLocation?.location);

    return res.status(200).json({
      success: true,
      stats: {
        resources: resourceCount,
        events: eventCount,
        helpRequests: helpRequestCount,
        skillsShared: skillCount
      },
      pendingActions: {
        messages: unreadMessageCount,
        borrowRequests: pendingBorrowRequests,
        skillRequests: pendingSkillRequests,
        helpOffers: pendingHelpOffers
      },
      recentActivity,
      nearbyEvents,
      recommendedResources,
      helpRequestsNearby
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard data"
    });
  }
};

// Improve the getRecentActivity function to always return real data

const getRecentActivity = async (userId) => {
  try {
    // Get recent activities from various collections
    const [resources, events, skills, helpRequests] = await Promise.all([
      Resource.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('ownerId', 'name'),
      
      Event.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('hostId', 'name'),
      
      SkillSharing.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name'),
      
      HelpRequest.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('requesterId', 'name')
        .populate('helperId', 'name')
    ]);

    // Format activities correctly
    const allActivities = [
      ...resources.map(r => ({
        description: `${r.ownerId?.name || 'Someone'} shared a resource: ${r.title}`,
        time: r.createdAt,
        type: 'resource',
        user: r.ownerId?.name?.[0] || '?',
        userName: r.ownerId?.name || 'Community Member'
      })),
      // ... Map other activities similarly
    ];

    // Sort by date and return limited number
    return allActivities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];  // Return empty array instead of mock data
  }
};