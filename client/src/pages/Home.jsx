// src/pages/Home.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
// Removed unused imports: Feed and RightSidebar

export default function Home() {
  const { userData } = useContext(AuthContext);
  const [communityData, setCommunityData] = useState({ 
    stats: { resources: 0, events: 0, helpRequests: 0 }, 
    recentActivity: [] 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log("Home component mounted, fetching dashboard data...");
        setLoading(true);
        
        // Try the correct API endpoint - without /api/v1/ prefix since API.js already includes it
        const response = await API.get("/dashboard");
        console.log("Dashboard data received:", response.data);
        
        if (response.data) {
          setCommunityData({
            stats: response.data.stats || { resources: 0, events: 0, helpRequests: 0 },
            recentActivity: response.data.recentActivity || []
          });
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        
        // Show user-friendly error
        setError("Unable to load dashboard data. Please try again later.");
        
        // Set default data to prevent rendering errors
        setCommunityData({
          stats: { resources: 0, events: 0, helpRequests: 0 },
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if user is logged in
    if (userData && userData._id) {
      fetchDashboardData();
    } else {
      console.log("User data not available yet, skipping dashboard fetch");
      setLoading(false);
    }
  }, [userData]);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#69C143]"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 bg-red-50 border border-red-200 rounded-md mt-4">
        <h1 className="text-2xl font-bold mb-2">Dashboard Unavailable</h1>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Reload Page
        </button>
      </div>
    );
  }
  
  // If we made it here, we have data to render
  console.log("Rendering Home component");
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Welcome, {userData?.name || "Neighbor"}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Community Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Community Stats</h2>
          <ul className="space-y-2">
            <li>Resources Shared: {communityData.stats.resources}</li>
            <li>Upcoming Events: {communityData.stats.events}</li>
            <li>Help Requests: {communityData.stats.helpRequests}</li>
          </ul>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {communityData.recentActivity.length > 0 ? (
            <ul className="space-y-2">
              {communityData.recentActivity.map((activity, index) => (
                <li key={index} className="text-sm">
                  {activity}
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent activity to display</p>
          )}
        </div>
        
        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="flex flex-col space-y-2">
            <a href="/resources" className="text-blue-600 hover:underline">Browse Resources</a>
            <a href="/events" className="text-blue-600 hover:underline">Upcoming Events</a>
            <a href="/skills" className="text-blue-600 hover:underline">Skill Exchange</a>
            <a href="/help" className="text-blue-600 hover:underline">Help Requests</a>
          </div>
        </div>
      </div>
    </div>
  );
}
