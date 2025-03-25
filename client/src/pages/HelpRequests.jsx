import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Spinner from "../components/ui/Spinner";
import HelpRequestCard from "../components/help/HelpRequestCard";
import HelpRequestDetailsModal from "../components/help/HelpRequestDetailsModal";

// Constants
const HELP_CATEGORIES = [
  "Childcare", "Repairs", "Home Assistance", "Medical", "Transportation", "Groceries", "Other"
];

export default function HelpRequests() {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State variables
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('community'); // Options: 'community' or 'my-requests'
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other",
    location: "",
    urgency: "medium"
  });
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [communityTab, setCommunityTab] = useState('pending');
  
  // Fetch help requests on component mount
  useEffect(() => {
    fetchHelpRequests();
  }, []);
  
  // Fetch help requests
  const fetchHelpRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await API.get("/help-requests");
      if (data.success) {
        setHelpRequests(data.helpRequests || []);
      } else {
        setError("Failed to load help requests");
      }
    } catch (err) {
      console.error("Error fetching help requests:", err);
      setError(err.response?.data?.message || "Failed to load help requests");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding a new request
  const handleAddRequest = () => {
    resetForm();
    setShowAddForm(!showAddForm);
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle form submission (create/update help request)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      
      if (isEditing && selectedRequest) {
        // Update existing request
        const { data } = await API.put(`/help-requests/${selectedRequest._id}`, formData);
        if (data.success) {
          toast.success("Help request updated successfully");
          setHelpRequests(prev => 
            prev.map(req => req._id === selectedRequest._id ? data.helpRequest : req)
          );
        }
      } else {
        // Create new request
        const { data } = await API.post("/help-requests", formData);
        if (data.success) {
          toast.success("Help request created successfully");
          setHelpRequests(prev => [data.helpRequest, ...prev]);
        }
      }
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error("Error saving help request:", err);
      toast.error(err.response?.data?.message || "Failed to save help request");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Reset form and editing state
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Other",
      location: "",
      urgency: "medium"
    });
    setShowAddForm(false);
    setIsEditing(false);
    setSelectedRequest(null);
  };
  
  // Edit a help request
  const handleEdit = (request) => {
    setSelectedRequest(request);
    setFormData({
      title: request.title,
      description: request.description,
      category: request.category,
      location: request.location,
      urgency: request.urgency || "medium"
    });
    setIsEditing(true);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  // Delete a help request
  const handleDelete = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this help request?")) {
      return;
    }
    
    try {
      setActionLoading(true);
      const { data } = await API.delete(`/help-requests/${requestId}`);
      
      if (data.success) {
        toast.success("Help request deleted successfully");
        setHelpRequests(prev => prev.filter(req => req._id !== requestId));
        
        // Close modal if open
        if (selectedRequest && selectedRequest._id === requestId) {
          setShowDetailsModal(false);
        }
      }
    } catch (err) {
      console.error("Error deleting help request:", err);
      toast.error(err.response?.data?.message || "Failed to delete help request");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Offer help for a request
  const handleOfferHelp = async (requestId) => {
    try {
      setActionLoading(true);
      const { data } = await API.put(`/help-requests/${requestId}/offer-help`);
      
      if (data.success) {
        toast.success("You've successfully offered to help");
        setHelpRequests(prev => 
          prev.map(req => req._id === requestId ? data.helpRequest : req)
        );
        
        // Close modal if open
        if (showDetailsModal) {
          setShowDetailsModal(false);
        }
      }
    } catch (err) {
      console.error("Error offering help:", err);
      toast.error(err.response?.data?.message || "Failed to offer help");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Mark a help request as completed
  const handleCompleteRequest = async (requestId) => {
    try {
      setActionLoading(true);
      const { data } = await API.put(`/help-requests/${requestId}/complete`);
      
      if (data.success) {
        toast.success("Help request marked as completed");
        setHelpRequests(prev => 
          prev.map(req => req._id === requestId ? data.helpRequest : req)
        );
        
        // Close modal if open
        if (showDetailsModal) {
          setShowDetailsModal(false);
        }
      }
    } catch (err) {
      console.error("Error completing help request:", err);
      toast.error(err.response?.data?.message || "Failed to complete help request");
    } finally {
      setActionLoading(false);
    }
  };
  
  // View request details
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };
  
  // Navigate to messages with the requester/helper
  const handleMessage = (userId) => {
    if (!userId) return;
    navigate(`/messages?with=${userId}`);
  };
  
  // Filter the help requests based on search query and category
  const filteredRequests = helpRequests.filter(request => {
    const matchesSearch = 
      searchQuery === "" || 
      request.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      request.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      request.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "" || request.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Separate requests into different categories
  const myRequests = filteredRequests.filter(request => request.requesterId?._id === userData?._id);
  const helpingRequests = filteredRequests.filter(request => 
    request.helperId?._id === userData?._id && request.requesterId?._id !== userData?._id);
  const communityRequests = filteredRequests.filter(request => 
    request.requesterId?._id !== userData?._id && 
    (!request.helperId || request.helperId?._id !== userData?._id));

  // Filter community requests based on communityTab
  const filteredCommunityRequests = communityTab === 'all' 
    ? communityRequests 
    : communityRequests.filter(req => req.status === communityTab);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Help Requests</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}
        
        {/* Search and Filter Bar */}
        <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search input */}
            <div className="relative w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search help requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border dark:border-gray-600 px-3 py-2 pl-10 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            
            {/* Category filter */}
            <div className="relative w-full md:w-1/4">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                <span>{selectedCategory || "All Categories"}</span>
                <ChevronDownIcon className={`h-5 w-5 transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} />
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                  <div
                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-800 dark:text-gray-200"
                    onClick={() => {
                      setSelectedCategory("");
                      setShowCategoryDropdown(false);
                    }}
                  >
                    All Categories
                  </div>
                  {HELP_CATEGORIES.map((cat) => (
                    <div
                      key={cat}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-800 dark:text-gray-200"
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
              <button
                onClick={handleAddRequest}
                className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-4 py-2 rounded flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                {showAddForm ? "Cancel" : "Request Help"}
              </button>
              <button 
                onClick={fetchHelpRequests}
                className="bg-gray-200 hover:bg-gray-300 p-2 rounded"
                title="Refresh requests"
                disabled={loading}
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Request Form (Create/Edit) */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{isEditing ? "Edit Help Request" : "Request Help"}</h2>
            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full border dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  placeholder="Short title for your request"
                />
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full border dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  placeholder="Describe what help you need"
                />
              </div>
              
              {/* Category and Urgency in a row */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="w-full sm:w-1/2">
                  <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full border dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  >
                    {HELP_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="w-full sm:w-1/2">
                  <label htmlFor="urgency" className="block text-sm font-medium mb-1">Urgency</label>
                  <select
                    id="urgency"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    className="w-full border dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              {/* Location */}
              <div className="mb-4">
                <label htmlFor="location" className="block text-sm font-medium mb-1">Location</label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full border dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  placeholder="Where is help needed?"
                />
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
                  disabled={actionLoading}
                  className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-4 py-2 rounded flex items-center"
                >
                  {actionLoading ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-1 animate-spin" />
                      {isEditing ? "Updating..." : "Submitting..."}
                    </>
                  ) : (
                    isEditing ? "Update Request" : "Submit Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 mt-6">
          <button
            onClick={() => setActiveMainTab('community')}
            className={`py-3 px-6 font-medium rounded-t-lg ${
              activeMainTab === 'community'
                ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-b-white dark:border-b-gray-800 text-blue-600 dark:text-blue-400'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Community Requests
          </button>
          <button
            onClick={() => setActiveMainTab('my-requests')}
            className={`py-3 px-6 font-medium rounded-t-lg ${
              activeMainTab === 'my-requests'
                ? 'bg-white border border-gray-200 border-b-white text-blue-600'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900'
            }`}
          >
            My Requests
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center my-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Community Requests Tab Content */}
            {activeMainTab === 'community' && (
              <div>
                {communityRequests.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 text-center text-gray-500 dark:text-gray-400 rounded">
                    No community help requests found. Check back later or be the first to help someone in your community!
                  </div>
                ) : (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-medium">Community Requests</h2>
                      <p className="text-sm text-gray-500">
                        {communityRequests.length} {communityRequests.length === 1 ? "request" : "requests"} available
                      </p>
                    </div>
                    
                    {/* Status Tabs for Community Requests */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                      <button 
                        onClick={() => setCommunityTab('all')}
                        className={`py-2 px-4 text-sm font-medium ${communityTab === 'all' 
                          ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
                      >
                        All
                      </button>
                      
                      <button 
                        onClick={() => setCommunityTab('pending')}
                        className={`py-2 px-4 text-sm font-medium ${communityTab === 'pending' 
                          ? 'border-b-2 border-yellow-500 text-yellow-600' 
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                      >
                        Pending
                      </button>

                      <button 
                        onClick={() => setCommunityTab('in-progress')}
                        className={`py-2 px-4 text-sm font-medium ${communityTab === 'in-progress' 
                          ? 'border-b-2 border-blue-500 text-blue-600' 
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                      >
                        In Progress
                      </button>

                      <button 
                        onClick={() => setCommunityTab('completed')}
                        className={`py-2 px-4 text-sm font-medium ${communityTab === 'completed' 
                          ? 'border-b-2 border-green-500 text-green-600' 
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                      >
                        Completed
                      </button>
                    </div>
                    
                    {/* Filtered community requests */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCommunityRequests.length === 0 ? (
                        <div className="bg-gray-50 p-4 text-center text-gray-500 rounded-lg col-span-full">
                          No {communityTab !== 'all' ? communityTab : ''} community requests found.
                        </div>
                      ) : (
                        filteredCommunityRequests.map((request) => (
                          <HelpRequestCard
                            key={request._id}
                            request={request}
                            userData={userData}
                            onViewDetails={handleViewDetails}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onMessage={handleMessage}
                            onComplete={handleCompleteRequest}
                            onOfferHelp={handleOfferHelp}
                            actionLoading={actionLoading}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* My Requests Tab Content */}
            {activeMainTab === 'my-requests' && (
              <div>
                {myRequests.length === 0 && helpingRequests.length === 0 ? (
                  <div className="bg-gray-50 p-6 text-center text-gray-500 rounded">
                    You have not created any help requests yet. Click &quot;Request Help&quot; to get started.
                  </div>
                ) : (
                  <>
                    {/* My requests */}
                    {myRequests.length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-lg font-medium">My Requests</h2>
                          <p className="text-sm text-gray-500">
                            {myRequests.length} {myRequests.length === 1 ? "request" : "requests"}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {myRequests.map((request) => (
                            <HelpRequestCard
                              key={request._id}
                              request={request}
                              userData={userData}
                              onViewDetails={handleViewDetails}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onMessage={handleMessage}
                              onComplete={handleCompleteRequest}
                              onOfferHelp={handleOfferHelp}
                              actionLoading={actionLoading}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Requests I'm helping with */}
                    {helpingRequests.length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-lg font-medium">Requests I am Helping With</h2>
                          <p className="text-sm text-gray-500">
                            {helpingRequests.length} {helpingRequests.length === 1 ? "request" : "requests"}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {helpingRequests.map((request) => (
                            <HelpRequestCard
                              key={request._id}
                              request={request}
                              userData={userData}
                              onViewDetails={handleViewDetails}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onMessage={handleMessage}
                              onComplete={handleCompleteRequest}
                              onOfferHelp={handleOfferHelp}
                              actionLoading={actionLoading}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Request Details Modal */}
            {showDetailsModal && selectedRequest && (
              <HelpRequestDetailsModal
                request={selectedRequest}
                onClose={() => setShowDetailsModal(false)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onMessage={handleMessage}
                onComplete={handleCompleteRequest}
                onOfferHelp={handleOfferHelp}
                actionLoading={actionLoading}
                userData={userData}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
