// src/pages/SkillSharing.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  XMarkIcon,
  UserIcon,
  AdjustmentsHorizontalIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import Spinner from "../components/ui/Spinner";
import SkillReviews from "../components/skills/SkillReviews";
import SkillRequests from '../components/skills/SkillRequests';

const SKILL_CATEGORIES = [
  "Technology",
  "Education",
  "Arts & Crafts",
  "Music",
  "Cooking",
  "Fitness",
  "Languages",
  "Business",
  "Home Improvement",
  "Other"
];

export default function SkillSharing() {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  // States
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("community"); // New state for tab management

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [locationFilter, setLocationFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "Other",
    availability: "available"
  });

  // Fetch skills on mount
  useEffect(() => {
    fetchSkills();
  }, []);

  // Debug logging to help identify issues - MOVED INSIDE COMPONENT
  useEffect(() => {
    if (skills.length > 0 && userData) {
      const bookedByUser = skills.filter(
        s => s.availability === "unavailable" && 
        s.bookedBy && 
        s.bookedBy._id === userData._id
      );
      
      console.log("DEBUG: Skills booked by current user:", bookedByUser);
      
      if (bookedByUser.length > 0) {
        console.log("DEBUG: You have skills that should show 'Mark as Completed' button");
      }
    }
  }, [skills, userData]);

  // Debug logging to help identify issues with Mark as Completed button
  useEffect(() => {
    if (skills.length > 0 && userData) {
      const bookedByUser = skills.filter(
        s => s.availability === "unavailable" && 
        s.bookedBy && 
        String(s.bookedBy._id) === String(userData._id)
      );
      
      if (bookedByUser.length > 0) {
        console.log("DEBUG INFO: Skills booked by current user:", bookedByUser);
        console.log("DEBUG INFO: User ID:", userData._id);
        console.log("DEBUG INFO: 'Mark as Completed' button should show for these skills");
      }
    }
  }, [skills, userData]);

  // Inside useEffect - add this debug check after fetching skills
  useEffect(() => {
    if (skills.length > 0 && userData) {
      const bookedByUser = skills.filter(
        s => s.availability === "unavailable" && 
        s.bookedBy && 
        String(s.bookedBy._id) === String(userData._id)
      );
      
      if (bookedByUser.length > 0) {
        console.log("DEBUG: Skills booked by current user:", bookedByUser);
        console.log("DEBUG: User ID:", userData._id);
      }
    }
  }, [skills, userData]);

  // Add this in your useEffect after fetching skills

  useEffect(() => {
    if (skills.length > 0 && userData) {
      console.log("DEBUG - All skills:", skills);
      console.log("DEBUG - Current user ID:", userData._id);
      
      const unavailableSkills = skills.filter(s => s.availability === "unavailable");
      console.log("DEBUG - Unavailable skills:", unavailableSkills);
      
      if (unavailableSkills.length > 0) {
        // Log the exact structure of bookedBy for each unavailable skill
        unavailableSkills.forEach(skill => {
          console.log(`Skill ${skill._id} (${skill.title}) bookedBy structure:`, skill.bookedBy);
          
          // Check if the current user should see the completion button
          const shouldShowButton = skill.bookedBy && 
            ((skill.bookedBy.userId && String(skill.bookedBy.userId) === String(userData._id)) || 
             (skill.bookedBy._id && String(skill.bookedBy._id) === String(userData._id)));
             
          console.log(`Should show completion button: ${shouldShowButton}`);
        });
      }
    }
  }, [skills, userData]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get("/skillsharings");
      
      // Add debug logging for skills that might need the complete button
      if (userData && data) {
        const bookedByCurrentUser = data.filter(
          s => s.availability === "unavailable" && 
          s.bookedBy && 
          String(s.bookedBy._id) === String(userData._id)
        );
        
        if (bookedByCurrentUser.length > 0) {
          console.log("Skills booked by current user:", bookedByCurrentUser);
        }
      }
      
      setSkills(data);
    } catch (err) {
      console.error("Error fetching skills:", err);
      setError(err.response?.data?.message || "Failed to load skills.");
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
      if (showEditForm && selectedSkill) {
        // Update
        const res = await API.put(`/skillsharings/${selectedSkill._id}`, formData);
        toast.success("Skill updated!");
        setSkills((prev) =>
          prev.map((skill) => (skill._id === selectedSkill._id ? res.data.skill : skill))
        );
      } else {
        // Add new
        const res = await API.post("/skillsharings", formData);
        toast.success("Skill added!");
        setSkills((prev) => [...prev, res.data.skill]);
      }
      resetForm();
      // Switch to My Skills tab after adding a skill
      if (!showEditForm) {
        setActiveTab("mySkills");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save skill.");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      category: "Other",
      availability: "available"
    });
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedSkill(null);
  };

  const handleEdit = (skill) => {
    setSelectedSkill(skill);
    setFormData({
      title: skill.title,
      description: skill.description,
      location: skill.location,
      category: skill.category || "Other",
      availability: skill.availability
    });
    setShowEditForm(true);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (skillId) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) {
      return;
    }
    
    try {
      const response = await API.delete(`/skillsharings/${skillId}`);
      
      // Check if there were canceled requests
      if (response.data.canceledRequests > 0) {
        toast.success(
          `Skill deleted successfully. ${response.data.canceledRequests} active request(s) were automatically canceled.`
        );
      } else {
        toast.success("Skill deleted successfully!");
      }
      
      // Remove from UI
      setSkills(prevSkills => prevSkills.filter(skill => skill._id !== skillId));
      setShowModal(false); // Close modal if open
      
    } catch (err) {
      console.error("Error deleting skill:", err);
      toast.error(
        err.response?.data?.message || 
        "Failed to delete skill. Please try again."
      );
    }
  };

  const openSkillDetails = (skill) => {
    setSelectedSkill(skill);
    setShowModal(true);
    setShowReviews(false);
  };

  const handleSkillRequest = async (skill) => {
    if (!userData) {
      toast.error("Please log in to request this skill");
      return;
    }
    
    const targetSkill = skill || selectedSkill;
    if (!targetSkill) return;
    
    try {
      setRequestLoading(true);
      await API.post("/skillrequests", {
        skillId: targetSkill._id,
        message: `I'm interested in your "${targetSkill.title}" skill.`
      });
      
      toast.success("Request sent successfully! Waiting for provider approval.");
      setShowModal(false);
    } catch (err) {
      console.error("Error requesting skill:", err);
      if (err.response?.status === 400 && err.response?.data?.requestStatus) {
        toast.info(`You already have a ${err.response.data.requestStatus} request for this skill.`);
      } else {
        toast.error(err.response?.data?.message || "Failed to send request. Please try again.");
      }
    } finally {
      setRequestLoading(false);
    }
  };

  const handleNavigateToMessages = (userId) => {
    navigate(`/messages?with=${userId}`);
  };

  // Filter skills based on active filters
  const filteredSkills = skills.filter((skill) => {
    // Search query filter
    const matchesSearch =
      !searchQuery ||
      skill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (skill.location && skill.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Category filter
    const matchesCategory = !selectedCategory || skill.category === selectedCategory;
    
    // Location filter
    const matchesLocation = 
      !locationFilter || 
      (skill.location && skill.location.toLowerCase().includes(locationFilter.toLowerCase()));
    
    // Availability filter
    const matchesAvailability = 
      !availabilityFilter || 
      skill.availability === availabilityFilter;
    
    return matchesSearch && matchesCategory && matchesLocation && matchesAvailability;
  });

  // Sort filtered skills
  const sortedSkills = [...filteredSkills].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortBy === "rating") {
      return (b.averageRating || 0) - (a.averageRating || 0);
    }
    return 0;
  });

  // Separate my skills and community skills
  const mySkills = userData ? sortedSkills.filter(s => s.userId?._id === userData._id) : [];
  const communitySkills = userData ? sortedSkills.filter(s => s.userId?._id !== userData?._id) : sortedSkills;

  // Improve the getSkillStatus function to show more info about bookings
  const getSkillStatus = (skill) => {
    if (skill.availability === "available") {
      return {
        label: "Available",
        icon: <CheckCircleIcon className="h-3 w-3 mr-1" />,
        classes: "bg-green-100 text-green-700"
      };
    } else if (skill.availability === "unavailable") {
      // Show who has booked the skill if current user is the provider
      if (skill.bookedBy && skill.userId?._id === userData?._id) {
        return {
          label: `Booked by ${skill.bookedBy.name || "Someone"}`,
          icon: <ClockIcon className="h-3 w-3 mr-1" />,
          classes: "bg-amber-100 text-amber-700"
        };
      }
      return {
        label: "Unavailable",
        icon: <XCircleIcon className="h-3 w-3 mr-1" />,
        classes: "bg-red-100 text-red-700"
      };
    }
    return {
      label: skill.availability || "Unknown",
      icon: null,
      classes: "bg-gray-100 text-gray-700"
    };
  };

  const handleToggleMultipleStudents = async (skillId, allowMultiple) => {
    try {
      const response = await API.put(`/skillsharings/${skillId}/settings`, {
        allowMultipleStudents: allowMultiple
      });
      
      if (response.data && response.data.skill) {
        // Update the skills state with the updated skill
        setSkills(prevSkills => 
          prevSkills.map(skill => 
            skill._id === skillId ? response.data.skill : skill
          )
        );
        
        toast.success(`Skill updated: ${allowMultiple ? 'Multiple students allowed' : 'One student at a time'}`);
      }
    } catch (err) {
      console.error("Error updating skill settings:", err);
      toast.error(err.response?.data?.message || "Failed to update skill settings");
    }
  };

  const handleCompleteSkill = async (skillId) => {
    if (!window.confirm(
      "Are you sure you want to mark this skill as completed?\n\n" +
      "This will:\n" +
      "• Make the skill available for other community members\n" +
      "• Allow you to leave a review\n" +
      "• Move this from active bookings to your history"
    )) {
      return;
    }
    
    try {
      console.log("Completing skill with ID:", skillId);
      const response = await API.put(`/skillrequests/complete-by-skill/${skillId}`);
      console.log("Server response:", response.data);
      
      if (response.data?.success) {
        toast.success("🎉 Skill marked as completed! Please leave a review.");
        
        // Navigate to skill-requests page with query parameter to automatically open review modal
        navigate('/skill-requests?openReview=true&requestId=' + response.data.request._id);
      }
    } catch (err) {
      console.error("Error completing skill:", err);
      toast.error(err.response?.data?.message || "Failed to mark as completed");
    }
  };

  // Render a skill card - standardized for both My Skills and Community Skills
  const renderSkillCard = (skill, isMySkill = false) => (
    <div
      key={skill._id}
      className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col skill-card"
      onClick={() => openSkillDetails(skill)}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {skill.title}
          </h3>
          <span className={`flex items-center text-xs px-2 py-1 rounded-full ${getSkillStatus(skill).classes}`}>
            {getSkillStatus(skill).icon}
            {getSkillStatus(skill).label}
          </span>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3 flex-grow">
          {skill.description}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded px-2 py-1">
              {skill.category || "Other"}
            </span>
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400 justify-end">
            <MapPinIcon className="w-3 h-3 mr-1" />
            {skill.location}
          </div>
        </div>
        
        <div className="flex items-center mb-3">
          <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full mr-2 flex items-center justify-center">
            {skill.userId?.name?.[0] || "?"}
          </div>
          <div>
            <span className="text-gray-700 dark:text-gray-300 text-sm">{skill.userId?.name || "Unknown"}</span>
            {skill.userId?.trustScore && (
              <div className="flex items-center">
                <StarIcon className="h-3 w-3 text-yellow-500 mr-0.5" />
                <span className="text-gray-600 dark:text-gray-400 text-xs">{skill.userId.trustScore.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons - Consistently styled for both tabs */}
        <div className="flex space-x-2 pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openSkillDetails(skill);
            }}
            className="flex-1 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View Details
          </button>
          
          {isMySkill ? (
            // My Skills Buttons
            <div className="flex space-x-2 flex-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(skill);
                }}
                className="flex-1 text-white bg-blue-500 hover:bg-blue-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(skill._id);
                }}
                className="flex-1 text-white bg-red-500 hover:bg-red-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          ) : (
            // Community Skills Buttons - only show if logged in and not my skill
            userData && skill.userId?._id !== userData._id && (
              <div className="flex space-x-2 flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigateToMessages(skill.userId._id);
                  }}
                  className="flex-1 text-white bg-blue-500 hover:bg-blue-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                  Message
                </button>
                
                {/* Conditional button: Complete if booked by current user, Request if available */}
                {skill.availability === "unavailable" && 
                 skill.bookedBy && 
                 ((skill.bookedBy.userId && String(skill.bookedBy.userId) === String(userData._id)) || 
                  (skill.bookedBy._id && String(skill.bookedBy._id) === String(userData._id))) ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteSkill(skill._id);
                    }}
                    className="flex-1 text-white bg-green-600 hover:bg-green-700 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Complete
                  </button>
                ) : skill.availability === "available" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSkillRequest(skill);
                    }}
                    className="flex-1 text-white bg-green-500 hover:bg-green-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Request
                  </button>
                )}
              </div>
            )
          )}
        </div>
        
        {isMySkill && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Allow multiple students?</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMultipleStudents(skill._id, !skill.allowMultipleStudents);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  skill.allowMultipleStudents ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    skill.allowMultipleStudents ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* ADD AN ALERT BANNER FOR SKILLS THAT NEED COMPLETION */}
      {userData && skills.some(s => s.availability === "unavailable" && s.bookedBy && s.bookedBy._id === userData._id) && (
        <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-4 rounded-r-md shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-base font-bold text-yellow-800">Action Required: Complete Your Skill Sessions</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="font-medium">
                  You have skills that you have been learning that can be marked as completed.
                </p>
                <p className="mt-1">
                  After receiving a skill service, please mark it as completed to make it available for other community members.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
            
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Skill Exchange</h1>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-4 py-2 rounded-md flex items-center justify-center"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            {showAddForm ? "Cancel" : "Share Skill"}
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-left">{showEditForm ? "Edit Skill" : "Add New Skill"}</h2>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="Online, In-Person, or Remote"
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
                    {SKILL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Availability */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Availability</label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              
              {/* Form buttons - aligned to end */}
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
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {showEditForm ? "Update Skill" : "Add Skill"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter Bar - Standardized with Resource Sharing */}
        <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col space-y-4">
            {/* Top row - search and main filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search skills by title, description or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-md border dark:border-gray-600 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {/* Category filter */}
              <div className="relative w-full md:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md py-2 px-4 pr-8 focus:ring-green-500 focus:border-green-500 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {SKILL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <ChevronDownIcon className="h-5 w-5" />
                </div>
              </div>
              
              {/* Sort By */}
              <div className="relative w-full md:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md py-2 px-4 pr-8 focus:ring-green-500 focus:border-green-500 dark:text-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="rating">Highest Rated</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <ChevronDownIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
            
            {/* Additional filters toggle */}
            <div className="flex items-center">
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className="text-blue-500 dark:text-blue-400 text-sm flex items-center"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
                {showFilters ? "Hide Filters" : "More Filters"}
                <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
              
              {(searchQuery || selectedCategory || locationFilter || availabilityFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                    setLocationFilter("");
                    setAvailabilityFilter("");
                  }}
                  className="ml-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Clear All Filters
                </button>
              )}
            </div>
            
            {/* Expanded filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Availability filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Availability</label>
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md py-2 px-3 focus:ring-green-500 focus:border-green-500 dark:text-white"
                  >
                    <option value="">All</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
                
                {/* Location type filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md py-2 px-3 focus:ring-green-500 focus:border-green-500 dark:text-white"
                  >
                    <option value="">All Locations</option>
                    <option value="Online">Online</option>
                    <option value="Remote">Remote</option>
                    <option value="In-Person">In-Person</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Active filters display */}
            {(searchQuery || selectedCategory || locationFilter || availabilityFilter) && (
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded dark:bg-blue-900/50 dark:text-blue-300">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery("")} className="ml-1 text-blue-500 dark:text-blue-300">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded dark:bg-blue-900/50 dark:text-blue-300">
                    Category: {selectedCategory}
                    <button onClick={() => setSelectedCategory("")} className="ml-1 text-blue-500 dark:text-blue-300">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {locationFilter && (
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded dark:bg-purple-900/50 dark:text-purple-300">
                    Location: {locationFilter}
                    <button onClick={() => setLocationFilter("")} className="ml-1 text-purple-500 dark:text-purple-300">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {availabilityFilter && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded dark:bg-green-900/50 dark:text-green-300">
                    Availability: {availabilityFilter === "available" ? "Available" : "Unavailable"}
                    <button onClick={() => setAvailabilityFilter("")} className="ml-1 text-green-500 dark:text-green-300">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation - Standardized with Resource Sharing */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            <li className="mr-2">
              <button
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === "community"
                    ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400 active"
                    : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("community")}
              >
                Community Skills
                {communitySkills.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    {communitySkills.length}
                  </span>
                )}
              </button>
            </li>
            {userData && (
              <li className="mr-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === "mySkills"
                      ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400 active"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("mySkills")}
                >
                  My Skills
                  {mySkills.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                      {mySkills.length}
                    </span>
                  )}
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Loading & Error States - These remain unchanged */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            {error}
            <button onClick={fetchSkills} className="ml-2 underline">Try again</button>
          </div>
        ) : (
          <div>
            {/* Tab Content */}
            {activeTab === "community" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full mr-3">
                      <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300">Community Skills</h2>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Skills offered by community members</p>
                    </div>
                  </div>
                </div>
                
                {communitySkills.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-5 text-center border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">No community skills found matching your filters</p>
                    <button 
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("");
                        setLocationFilter("");
                        setAvailabilityFilter("");
                      }}
                      className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {communitySkills.map(skill => renderSkillCard(skill, false))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "mySkills" && userData && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full mr-3">
                      <UserIcon className="h-5 w-5 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-green-800 dark:text-green-300">My Skills</h2>
                      <p className="text-xs text-green-600 dark:text-green-400">Skills you are offering to the community</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="text-sm flex items-center text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md shadow-sm transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Skill
                  </button>
                </div>
                
                {/* Pending Skill Requests section */}
                <div className="mb-6 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 font-medium text-purple-800 dark:text-purple-300 border-b border-purple-200 dark:border-purple-800">
                    Pending Skill Requests
                  </div>
                  <SkillRequests onRequestProcessed={fetchSkills} />
                </div>
                
                {/* My Skills section - directly connected with no extra spacing */}
                {mySkills.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">You have not shared any skills yet</p>
                    <button 
                      onClick={() => setShowAddForm(true)}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      Share your first skill
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {mySkills.map(skill => renderSkillCard(skill, true))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Skill Details Modal */}
        {showModal && selectedSkill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {!showReviews ? (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-2xl font-bold dark:text-white">{selectedSkill.title}</h2>
                      <button 
                        onClick={() => setShowModal(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <XCircleIcon className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className={`flex items-center text-sm px-3 py-1 rounded-full ${getSkillStatus(selectedSkill).classes}`}>
                        {getSkillStatus(selectedSkill).icon}
                        {getSkillStatus(selectedSkill).label}
                      </span>
                      
                      <span className="inline-block bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-600">
                        {selectedSkill.category || "Other"}
                      </span>
                      
                      <span className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 rounded-full px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {selectedSkill.location || "No location specified"}
                      </span>
                    </div>

                    {selectedSkill.availability !== 'available' && selectedSkill.bookedBy && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center text-blue-700 dark:text-blue-300">
                          <UserIcon className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                          <span>This skill is currently booked by <span className="font-medium">{selectedSkill.bookedBy.name}</span></span>
                        </div>
                        
                        {/* Make the completion button SUPER visible for the booked user */}
                        {userData && selectedSkill.bookedBy._id === userData._id && (
                          <div className="mt-4 bg-green-50 p-4 rounded-lg border-2 border-dashed border-green-400 animate-pulse">
                            <p className="font-medium text-green-800 mb-3 text-center">
                              After receiving this skill service, please mark it as completed
                            </p>
                            <button
                              onClick={() => handleCompleteSkill(selectedSkill._id)}
                              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold text-lg shadow-md transition-colors flex items-center justify-center"
                            >
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                              MARK AS COMPLETED
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                      <h3 className="text-lg font-medium mb-2 dark:text-white">Description</h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{selectedSkill.description}</p>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                      <h3 className="font-medium mb-3 dark:text-white">Offered by</h3>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3 text-lg font-semibold dark:text-white">
                          {selectedSkill.userId?.name?.[0] || "?"}
                        </div>
                        <div>
                          <div className="font-medium dark:text-white">{selectedSkill.userId?.name || "Unknown"}</div>
                          {selectedSkill.userId?.trustScore && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                              <span>{selectedSkill.userId.trustScore.toFixed(1)}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                                ({selectedSkill.userId.totalReviews || 0} reviews)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                      <button
                        onClick={() => setShowModal(false)}
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded"
                      >
                        Close
                      </button>
                      {userData && userData._id === selectedSkill.userId?._id ? (
                        // My skill actions - unchanged
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setShowModal(false);
                              handleEdit(selectedSkill);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit Skill
                          </button>
                          <button
                            onClick={() => handleDelete(selectedSkill._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      ) : (
                        // Actions for others' skills - modified
                        <div className="flex space-x-2">
                          {userData && 
                          userData._id !== selectedSkill.userId?._id && (
                            <button
                              onClick={() => {
                                navigate(`/messages?with=${selectedSkill.userId._id}`);
                                setShowModal(false);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                            >
                              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                              Message Provider
                            </button>
                          )}
                          
                          {/* Conditional button: Complete if booked by current user, Request if available */}
                          {userData && 
                           userData._id !== selectedSkill.userId?._id && 
                           selectedSkill.availability === "unavailable" && 
                           selectedSkill.bookedBy && 
                           ((selectedSkill.bookedBy.userId && String(selectedSkill.bookedBy.userId) === String(userData._id)) || 
                            (selectedSkill.bookedBy._id && String(selectedSkill.bookedBy._id) === String(userData._id))) ? (
                            <button
                              onClick={() => handleCompleteSkill(selectedSkill._id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Mark as Completed
                            </button>
                          ) : userData && 
                             userData._id !== selectedSkill.userId?._id && 
                             selectedSkill.availability === 'available' && (
                            <button
                              onClick={() => handleSkillRequest()}
                              disabled={requestLoading}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center"
                            >
                              {requestLoading ? (
                                <span className="flex items-center">
                                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-1" />
                                  Sending...
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Request to Learn
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <SkillReviews 
                    skillId={selectedSkill._id}
                    showTitle={true}
                    onClose={() => setShowReviews(false)} 
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
          
      {/* CSS for improved UI consistency */}
      <style>
        {`
          .skill-card {
            border-radius: 12px;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease-in-out;
          }
          .skill-card:hover {
            transform: scale(1.02);
          }
          .line-clamp-3 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          /* Mobile responsiveness improvements */
          @media (max-width: 640px) {
            .skill-card {
              max-width: 100%;
            }
            .grid {
              gap: 1rem;
            }
            /* Ensure buttons don't get too cramped on mobile */
            .skill-card button {
              padding: 0.5rem 0.75rem;
              font-size: 0.75rem;
            }
          }
        `}
      </style>
    </div>
  );
}