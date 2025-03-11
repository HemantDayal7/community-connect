// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch authenticated user details
        const userRes = await API.get("/auth/me");
        // Fetch shared resources
        const resourcesRes = await API.get("/resources");
        // Fetch upcoming events
        const eventsRes = await API.get("/events");

        setUser(userRes.data);
        setResources(resourcesRes.data);
        setEvents(eventsRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <p className="text-center mt-6">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="container mx-auto px-6 py-8">
      {/* User Profile Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold">Welcome, {user?.name}!</h2>
        <p className="text-gray-600 dark:text-gray-300">Email: {user?.email}</p>
      </div>

      {/* Recent Community Activities */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Resources Section */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h3 className="text-xl font-bold">Recently Shared Resources</h3>
          <ul className="mt-3 space-y-2">
            {resources.length === 0 ? (
              <p>No resources available.</p>
            ) : (
              resources.map((resource) => (
                <li key={resource._id} className="border-b pb-2">
                  {resource.title} - {resource.category}
                </li>
              ))
            )}
          </ul>
          <Link to="/resources" className="text-blue-600 mt-4 block">
            View All Resources
          </Link>
        </div>

        {/* Events Section */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h3 className="text-xl font-bold">Upcoming Events</h3>
          <ul className="mt-3 space-y-2">
            {events.length === 0 ? (
              <p>No events available.</p>
            ) : (
              events.map((event) => (
                <li key={event._id} className="border-b pb-2">
                  {event.name} - {new Date(event.date).toLocaleDateString()}
                </li>
              ))
            )}
          </ul>
          <Link to="/events" className="text-blue-600 mt-4 block">
            View All Events
          </Link>
        </div>
      </div>
    </div>
  );
}
