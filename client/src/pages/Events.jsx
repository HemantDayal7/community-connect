import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import Spinner from "../components/ui/Spinner";
import EventCard from '../components/events/EventCard';
import EventDetailsModal from '../components/events/EventDetailsModal';

// Event categories
const EVENT_CATEGORIES = [
  "Education",
  "Social",
  "Fitness",
  "Arts & Culture",
  "Technology",
  "Community Service",
  "Other"
];

// Helper function to check if a user is attending an event
const isUserAttending = (event, userId) => {
  if (!event || !event.attendees || !Array.isArray(event.attendees) || !userId) {
    return false;
  }
  
  return event.attendees.some(attendee => {
    // Handle both populated attendee objects and plain IDs
    const attendeeId = typeof attendee === 'object' ? attendee._id : attendee;
    return attendeeId && attendeeId.toString() === userId.toString();
  });
};

export default function Events() {
  const navigate = useNavigate(); // Add the hook
  const { userData } = useContext(AuthContext);
  
  // States
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDThh:mm
    location: "",
    category: "Other"
  });

  // Helper function to count events by category
  const getCategoryCounts = () => {
    const counts = {};
    events.forEach(event => {
      const category = event.category || "Other";
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  };

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get("/events");
      setEvents(data.events || []);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.response?.data?.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showEditForm && selectedEvent) {
        // Update
        const res = await API.put(`/events/${selectedEvent._id}`, formData);
        toast.success("Event updated successfully!");
        setEvents((prev) =>
          prev.map((event) => (event._id === selectedEvent._id ? res.data.event : event))
        );
      } else {
        // Add new
        const res = await API.post("/events", formData);
        toast.success("Event created successfully!");
        setEvents((prev) => [...prev, res.data.event]);
      }
      resetForm();
    } catch (err) {
      console.error("Error saving event:", err);
      toast.error(err.response?.data?.message || "Failed to save event.");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: new Date().toISOString().slice(0, 16),
      location: "",
      category: "Other"
    });
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedEvent(null);
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      date: new Date(event.date).toISOString().slice(0, 16),
      location: event.location,
      category: event.category || "Other"
    });
    setShowEditForm(true);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event? This will notify all attendees.")) {
      return;
    }
    
    try {
      await API.delete(`/events/${eventId}`);
      toast.success("Event deleted successfully!");
      setEvents((prev) => prev.filter((event) => event._id !== eventId));
      
      // Close modal if open
      if (selectedEvent && selectedEvent._id === eventId) {
        setShowEventModal(false);
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      toast.error(err.response?.data?.message || "Failed to delete event.");
    }
  };

  const handleRSVP = async (eventId) => {
    try {
      setRsvpLoading(true);
      const { data } = await API.put(`/events/${eventId}/rsvp`);
      toast.success("Successfully RSVP'd to event!");
      
      // Use the server response data to update events
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId ? data.event : event
        )
      );
      
      // Also update the selected event if modal is open
      if (selectedEvent && selectedEvent._id === eventId) {
        setSelectedEvent(data.event);
      }
    } catch (err) {
      console.error("Error RSVPing to event:", err);
      toast.error(err.response?.data?.message || "Failed to join the event.");
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleCancelRSVP = async (eventId) => {
    try {
      setRsvpLoading(true);
      const { data } = await API.put(`/events/${eventId}/cancel-rsvp`);
      toast.success("RSVP canceled successfully");
      
      // Use the server response data to update events
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId ? data.event : event
        )
      );
      
      // Also update the selected event if modal is open
      if (selectedEvent && selectedEvent._id === eventId) {
        setSelectedEvent(data.event);
      }
    } catch (err) {
      console.error("Error canceling RSVP:", err);
      toast.error(err.response?.data?.message || "Failed to cancel RSVP.");
    } finally {
      setRsvpLoading(false);
    }
  };

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };
  
  // Handle messaging
  const handleMessage = (userId) => {
    navigate(`/messages?with=${userId}`);
    setShowEventModal(false);
  };

  // Filter events based on search and category
  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      !searchQuery || 
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = filteredEvents.filter(event => new Date(event.date) >= now);
  const pastEvents = filteredEvents.filter(event => new Date(event.date) < now);

  // Separate user's events
  const userEvents = userData ? upcomingEvents.filter(event => event.hostId?._id === userData._id) : [];
  const communityEvents = userData ? upcomingEvents.filter(event => event.hostId?._id !== userData._id) : upcomingEvents;

  return (
    <div>
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Community Events</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
              
          {/* Search and Filter Bar */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search input */}
              <div className="relative w-full md:w-1/3">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border px-3 py-2 pl-10 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              
              {/* Category filter */}
              <div className="relative w-full md:w-1/4">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-white border rounded hover:bg-gray-50"
                >
                  <span>{selectedCategory || "All Categories"}</span>
                  <ChevronDownIcon
                    className={`h-5 w-5 transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`}
                  />
                </button>
                {showCategoryDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div
                      className="p-2 hover:bg-blue-50 cursor-pointer"
                      onClick={() => {
                        setSelectedCategory("");
                        setShowCategoryDropdown(false);
                      }}
                    >
                      All Categories
                    </div>
                    {EVENT_CATEGORIES.map((cat) => (
                      <div
                        key={cat}
                        className="p-2 hover:bg-blue-50 cursor-pointer"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Action button */}
              <div className="flex space-x-2 md:ml-auto">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-4 py-2 rounded flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  {showAddForm ? "Cancel" : "Create Event"}
                </button>
              </div>
            </div>
            
            {/* Category statistics */}
            <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-2">
              <span className="font-medium">Popular categories:</span>
              {Object.entries(getCategoryCounts())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([cat, count]) => (
                  <span 
                    key={cat} 
                    className="cursor-pointer hover:text-blue-500"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    {cat} ({count})
                  </span>
                ))}
            </div>
          </div>
          
          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">{showEditForm ? "Edit Event" : "Create Event"}</h2>
              <form onSubmit={handleSubmit} className="text-left">
                {/* Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    required
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Date and Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Location */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Category */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {EVENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Form buttons */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border rounded bg-gray-100 px-4 py-2 mr-2 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-4 py-2 rounded"
                  >
                    {showEditForm ? "Update Event" : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-start my-8">
              <Spinner size="lg" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-gray-50 p-6 text-gray-500 rounded">
              No events found. Try adjusting your search or create a new event.
            </div>
          ) : (
            <>
              {/* My Events Section */}
              {userData && userEvents.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-medium">My Events</h2>
                    <p className="text-sm text-gray-500">
                      {userEvents.length} events
                    </p>
                  </div>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {userEvents.map(event => (
                      <EventCard
                        key={event._id}
                        event={event}
                        userData={userData}
                        onRSVP={handleRSVP}
                        onCancelRSVP={handleCancelRSVP}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onViewDetails={openEventDetails}
                        onOpenChat={handleMessage}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Upcoming Events Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-medium">Upcoming Events</h2>
                  <p className="text-sm text-gray-500">
                    {communityEvents.length} events
                  </p>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {communityEvents.map(event => (
                    <EventCard
                      key={event._id}
                      event={event}
                      userData={userData}
                      onRSVP={handleRSVP}
                      onCancelRSVP={handleCancelRSVP}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onViewDetails={openEventDetails}
                      onOpenChat={handleMessage}
                    />
                  ))}
                </div>
              </div>
              
              {/* Past Events Section */}
              {pastEvents.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-medium">Past Events</h2>
                    <p className="text-sm text-gray-500">
                      {pastEvents.length} events
                    </p>
                  </div>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {pastEvents.map(event => (
                      <EventCard
                        key={event._id}
                        event={event}
                        userData={userData}
                        onRSVP={handleRSVP}
                        onCancelRSVP={handleCancelRSVP}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onViewDetails={openEventDetails}
                        onOpenChat={handleMessage}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Event Details Modal */}
          {showEventModal && selectedEvent && (
            <EventDetailsModal
              event={selectedEvent}
              isHost={userData && userData._id === selectedEvent.hostId?._id}
              isAttending={isUserAttending(selectedEvent, userData?._id)}
              onClose={() => setShowEventModal(false)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRSVP={handleRSVP}
              onCancelRSVP={handleCancelRSVP}
              onMessage={handleMessage}
              rsvpLoading={rsvpLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
