// src/pages/SkillSharing.jsx
import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import Spinner from "../components/ui/Spinner";
import SkillReviews from "../components/skills/SkillReviews";
// import MainLayout from "../components/layout/MainLayout";

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

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "Other",
    availability: "available"
  });

  // Add near the top of your component
  const getCategoryCounts = () => {
    const counts = {};
    skills.forEach(skill => {
      const category = skill.category || "Other";
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  };

  // Fetch skills on mount
  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get("/skillsharings");
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

  const handleSkillRequest = async () => {
    if (!userData || !selectedSkill) return;
    try {
      setRequestLoading(true);
      
      // Only create the request, not an automatic message
      await API.post("/skillrequests", {
        skillId: selectedSkill._id,
        message: `I'm interested in your "${selectedSkill.title}" skill.`
      });
      
      toast.success("Request sent successfully!");
      setShowModal(false);
      
      // Show an option to message if desired
      toast.info(
        <div>
          Request sent! 
          <button 
            onClick={() => navigate(`/messages?with=${selectedSkill.userId._id}`)}
            className="ml-2 underline text-blue-500 hover:text-blue-700"
          >
            Message provider
          </button>
        </div>,
        { autoClose: 8000 }
      );
    } catch (err) {
      console.error("Error requesting skill:", err);
      if (err.response?.status === 400 && err.response?.data?.requestStatus) {
        toast.info(`You already have a ${err.response.data.requestStatus} request for this skill.`);
        setShowModal(false);
      } else {
        toast.error(err.response?.data?.message || "Failed to send request. Please try again.");
      }
    } finally {
      setRequestLoading(false);
    }
  };

  // Filter
  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      !searchQuery ||
      skill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Use EXACTLY the same container as Resources page */}
      <div className="p-6 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Skill Exchange</h1>
        
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
                placeholder="Search skills..."
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
              {/* Keep existing dropdown code */}
              {showCategoryDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {/* Keep existing dropdown items */}
                  <div
                    className="p-2 hover:bg-blue-50 cursor-pointer"
                    onClick={() => {
                      setSelectedCategory("");
                      setShowCategoryDropdown(false);
                    }}
                  >
                    All Categories
                  </div>
                  {SKILL_CATEGORIES.map((cat) => (
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
            
            {/* Action buttons */}
            <div className="flex space-x-2 md:ml-auto">
              <Link
                to="/skill-requests"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Manage Requests
              </Link>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                {showAddForm ? "Cancel" : "Add Skill"}
              </button>
            </div>
          </div>
          
          {/* Keep category stats */}
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
            <h2 className="text-xl font-semibold mb-4 text-left">{showEditForm ? "Edit Skill" : "Add Skill"}</h2>
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
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
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

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-start my-8">
            <Spinner size="lg" />
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="bg-gray-50 p-6 text-gray-500 rounded">
            No skills found. Try adjusting your search or add a new skill.
          </div>
        ) : (
          <>
            {/* My Skills Section */}
            {userData && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-medium">My Skills</h2>
                  <p className="text-sm text-gray-500">
                    {filteredSkills.filter(s => s.userId?._id === userData._id).length} skills
                  </p>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredSkills
                    .filter(s => s.userId?._id === userData._id)
                    .map(skill => (
                      <div
                        key={skill._id}
                        onClick={() => openSkillDetails(skill)}
                        className="bg-white rounded shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-100"
                      >
                        <div className="p-4 text-left">
                          {/* Card content */}
                          {/* Title + Availability */}
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold truncate">
                              {skill.title}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded ${
                              skill.availability === 'available' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {skill.availability === 'available' ? 'Available' : 'Booked'}
                            </span>
                            {/* Add this block to show who booked the skill */}
                            {skill.availability !== 'available' && skill.bookedBy && (
                              <div className="text-xs text-gray-500 mt-1">
                                Booked by: {skill.bookedBy.name}
                              </div>
                            )}
                          </div>
                          {/* Description */}
                          <p className="text-gray-600 text-sm line-clamp-2 my-2">
                            {skill.description}
                          </p>
                          {/* Category */}
                          <span className="inline-block bg-gray-100 text-xs text-gray-600 rounded px-2 py-1">
                            {skill.category || "Other"}
                          </span>
                          {/* Location */}
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <MapPinIcon className="w-3 h-3 mr-1" />
                            {skill.location}
                          </div>
                          {/* Provider details with trust score - KEEP THIS ONE */}
                          <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center text-xs">
                              <div className="w-6 h-6 bg-gray-200 rounded-full mr-2 flex items-center justify-center">
                                {skill.userId?.name?.[0] || "?"}
                              </div>
                              <div>
                                <span className="text-gray-700">{skill.userId?.name || "Unknown"}</span>
                                {skill.userId?.trustScore && (
                                  <div className="flex items-center">
                                    <StarIcon className="h-3 w-3 text-yellow-500 mr-0.5" />
                                    <span className="text-gray-600">{skill.userId.trustScore.toFixed(1)}</span>
                                    <span className="text-xs text-gray-400 ml-1">
                                      ({skill.userId.totalReviews || 0})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Edit/Delete buttons if owner */}
                            {userData && skill.userId?._id === userData._id && (
                              <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="text-blue-500 hover:bg-blue-100 p-1 rounded"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleEdit(skill);
                                    }}
                                    title="Edit skill"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="text-red-500 hover:bg-red-100 p-1 rounded"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDelete(skill._id);
                                    }}
                                    title="Delete skill"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Community Skills Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-medium">Community Skills</h2>
                  <p className="text-sm text-gray-500">
                    {filteredSkills.filter(s => s.userId?._id !== userData?._id).length} skills
                  </p>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredSkills
                    .filter(s => s.userId?._id !== userData?._id)
                    .map(skill => (
                      <div
                        key={skill._id}
                        onClick={() => openSkillDetails(skill)}
                        className="bg-white rounded shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-100"
                      >
                        <div className="p-4 text-left">
                          {/* Card content */}
                          {/* Title + Availability */}
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold truncate mb-1">
                              {skill.title}
                            </h3>
                            <div className="flex flex-col items-end">
                              <span className={`text-xs px-2 py-1 rounded ${
                                skill.availability === "available"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {skill.availability === "available" ? "Available" : "Booked"}
                              </span>
                              
                              {/* Add this block to show who booked the skill */}
                              {skill.availability !== "available" && skill.bookedBy && skill.bookedBy.name && (
                                <div className="text-xs text-gray-500 mt-1">
                                  by {skill.bookedBy.name}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Rest of card content */}
                          {/* Description */}
                          <p className="text-gray-600 text-sm line-clamp-2 my-2">
                            {skill.description}
                          </p>
                          {/* Category */}
                          <span className="inline-block bg-gray-100 text-xs text-gray-600 rounded px-2 py-1">
                            {skill.category || "Other"}
                          </span>
                          {/* Location */}
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <MapPinIcon className="w-3 h-3 mr-1" />
                            {skill.location}
                          </div>
                          {/* Provider details with trust score */}
                          <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center text-xs">
                              <div className="w-6 h-6 bg-gray-200 rounded-full mr-2 flex items-center justify-center">
                                {skill.userId?.name?.[0] || "?"}
                              </div>
                              <div>
                                <span>{skill.userId?.name || "Unknown"}</span>
                                {skill.userId?.trustScore && (
                                  <span className="ml-2 flex items-center">
                                    <StarIcon className="h-3 w-3 text-yellow-500 mr-0.5" />
                                    {skill.userId.trustScore.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Edit/Delete buttons if owner */}
                            {userData && skill.userId?._id === userData._id && (
                              <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="text-blue-500 hover:bg-blue-100 p-1 rounded"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleEdit(skill);
                                  }}
                                  title="Edit skill"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  className="text-red-500 hover:bg-red-100 p-1 rounded"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete(skill._id);
                                  }}
                                  title="Delete skill"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* Skill Details Modal */}
          {showModal && selectedSkill && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  {!showReviews ? (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold">{selectedSkill.title}</h2>
                        <button 
                          onClick={() => setShowModal(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XCircleIcon className="h-6 w-6" />
                        </button>
                      </div>
                      
                      <div className="mb-4">
                        <span className={`inline-block text-sm px-3 py-1 rounded-full mb-2 ${
                          selectedSkill.availability === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedSkill.availability === 'available' ? 'Available' : 'Currently Booked'}
                        </span>

                        {/* Add this block to show booker information */}
                        {selectedSkill.availability !== 'available' && selectedSkill.bookedBy && selectedSkill.bookedBy.name && (
                          <div className="mt-1 mb-3 text-sm text-gray-600">
                            This skill is currently booked by <span className="font-medium">{selectedSkill.bookedBy.name}</span>
                          </div>
                        )}

                        {/* Rest of modal content */}
                        <p className="text-gray-700 mb-4 mt-3">{selectedSkill.description}</p>
                        
                        {/* Add this block to show booker information */}
                        {selectedSkill.availability !== 'available' && selectedSkill.bookedBy && (
                          <div className="mt-2 text-sm text-gray-600">
                            Booked by: <span className="font-medium">{selectedSkill.bookedBy.name}</span>
                          </div>
                        )}
                        
                        {/* Rest of the modal content */}
                      </div>
                      
                      {/* In the modal's "Offered by" section */}
                      <div className="border-t pt-4 mb-6">
                        <h3 className="font-medium mb-2">Offered by</h3>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                            {selectedSkill.userId?.name?.[0] || "?"}
                          </div>
                          <div>
                            <span className="font-medium">{selectedSkill.userId?.name || "Unknown"}</span>
                            {selectedSkill.userId?.trustScore && (
                              <div className="flex items-center text-sm text-gray-600">
                                <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                                <span>{selectedSkill.userId.trustScore.toFixed(1)}</span>
                                <span className="text-xs text-gray-400 ml-1">
                                  ({selectedSkill.userId.totalReviews || 0} reviews)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between border-t pt-4 mt-4">
                        <button
                          onClick={() => setShowModal(false)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded mr-2"
                        >
                          Close
                        </button>
                        
                        {/* Only show request button if: 
                            1. User is logged in
                            2. User is not the owner 
                            3. Skill is AVAILABLE */}
                        {userData && 
                        userData._id !== selectedSkill.userId?._id &&
                        selectedSkill.availability === 'available' && (
                          <button
                            onClick={handleSkillRequest}
                            disabled={requestLoading}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                          >
                            {requestLoading ? (
                              <span className="flex items-center">
                                <ArrowPathIcon className="h-4 w-4 animate-spin mr-1" />
                                Sending...
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Request This Skill
                              </span>
                            )}
                          </button>
                        )}
                        
                        {/* Show unavailable message when skill is booked */}
                        {userData && 
                        userData._id !== selectedSkill.userId?._id &&
                        selectedSkill.availability !== 'available' && (
                          <span className="bg-gray-100 text-gray-500 px-4 py-2 rounded flex items-center">
                            Currently Unavailable
                          </span>
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
  
    </div>
  );
}
