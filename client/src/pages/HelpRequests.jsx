import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  ChevronDownIcon,
  HandRaisedIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import Spinner from "../components/ui/Spinner";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

// Constants
const HELP_CATEGORIES = [
  "Childcare", "Repairs", "Home Assistance", "Medical", "Transportation", "Groceries", "Other"
];

const URGENCY_LEVELS = {
  low: { label: "Low", color: "bg-blue-100 text-blue-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", color: "bg-red-100 text-red-700" }
};

// SearchFilterBar Component
const SearchFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  showCategoryDropdown,
  setShowCategoryDropdown,
  filterStatus,
  setFilterStatus,
  showFilterDropdown,
  setShowFilterDropdown,
  handleAddRequest,
  showAddForm,
  fetchHelpRequests,
  loading
}) => (
  <div className="mb-6 bg-gray-50 p-4 rounded-lg">
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search input */}
      <div className="relative w-full md:w-1/3">
        <input
          type="text"
          placeholder="Search help requests..."
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
            {HELP_CATEGORIES.map((cat) => (
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
      
      {/* Status filter */}
      <div className="relative w-full md:w-1/4">
        <button
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          className="w-full flex items-center justify-between px-4 py-2 bg-white border rounded hover:bg-gray-50"
        >
          <span>{filterStatus ? filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1) : "All Status"}</span>
          <ChevronDownIcon
            className={`h-5 w-5 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
          />
        </button>
        {showFilterDropdown && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg overflow-auto">
            <div
              className="p-2 hover:bg-blue-50 cursor-pointer"
              onClick={() => {
                setFilterStatus("");
                setShowFilterDropdown(false);
              }}
            >
              All Status
            </div>
            {["pending", "in-progress", "completed", "canceled"].map((status) => (
              <div
                key={status}
                className="p-2 hover:bg-blue-50 cursor-pointer"
                onClick={() => {
                  setFilterStatus(status);
                  setShowFilterDropdown(false);
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex space-x-2 md:ml-auto">
        <button
          onClick={handleAddRequest}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center"
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
);

SearchFilterBar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  selectedCategory: PropTypes.string.isRequired,
  setSelectedCategory: PropTypes.func.isRequired,
  showCategoryDropdown: PropTypes.bool.isRequired,
  setShowCategoryDropdown: PropTypes.func.isRequired,
  filterStatus: PropTypes.string.isRequired,
  setFilterStatus: PropTypes.func.isRequired,
  showFilterDropdown: PropTypes.bool.isRequired,
  setShowFilterDropdown: PropTypes.func.isRequired,
  handleAddRequest: PropTypes.func.isRequired,
  showAddForm: PropTypes.bool.isRequired,
  fetchHelpRequests: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
};

// RequestForm component
const RequestForm = ({ formData, handleChange, handleSubmit, resetForm, isEditing, actionLoading }) => (
  <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
    <h2 className="text-xl font-semibold mb-4">{isEditing ? "Edit Help Request" : "Request Help"}</h2>
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
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
);

RequestForm.propTypes = {
  formData: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired,
  isEditing: PropTypes.bool.isRequired,
  actionLoading: PropTypes.bool.isRequired
};

// HelpRequestsList - Presentational Component
const HelpRequestsList = ({ 
  requests, 
  title, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onMessage,
  onComplete,
  onOfferHelp,
  actionLoading,
  isUserRequest, 
  isHelping,
}) => {
  const [activeTab, setActiveTab] = useState('all');
  
  if (requests.length === 0) return null;
  
  // Filter requests by status
  const filteredByStatus = activeTab === 'all' 
    ? requests 
    : requests.filter(req => req.status === activeTab);
  
  // Get count by status for badges
  const pendingCount = requests.filter(req => req.status === 'pending').length;
  const inProgressCount = requests.filter(req => req.status === 'in-progress').length;
  const completedCount = requests.filter(req => req.status === 'completed').length;
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-gray-500">
          {requests.length} {requests.length === 1 ? "request" : "requests"}
        </p>
      </div>
      
      {/* Status Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button 
          onClick={() => setActiveTab('all')}
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'all' 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          All <span className="ml-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">{requests.length}</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('pending')}
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'pending' 
            ? 'border-b-2 border-yellow-500 text-yellow-600' 
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Pending <span className="ml-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">{pendingCount}</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('in-progress')}
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'in-progress' 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          In Progress <span className="ml-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{inProgressCount}</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('completed')}
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'completed' 
            ? 'border-b-2 border-green-500 text-green-600' 
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Completed <span className="ml-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{completedCount}</span>
        </button>
      </div>
      
      {/* Request list - now filtered by status tab */}
      <div className="space-y-4">
        {filteredByStatus.length === 0 ? (
          <div className="bg-gray-50 p-4 text-center text-gray-500 rounded-lg">
            No {activeTab !== 'all' ? activeTab : ''} requests found.
          </div>
        ) : (
          filteredByStatus.map((request) => (
            // Rest of your existing request card code
            <div 
              key={request._id} 
              className={`rounded shadow-sm border overflow-hidden hover:shadow-md transition-shadow
                ${request.status === 'pending' ? 'bg-white border-yellow-200' : ''}
                ${request.status === 'in-progress' ? 'bg-blue-50 border-blue-200' : ''}
                ${request.status === 'completed' ? 'bg-green-50 border-green-200' : ''}
                ${request.status === 'canceled' ? 'bg-gray-50 border-gray-200' : ''}
              `}
            >
              {/* Existing request card content */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{request.title}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs ${URGENCY_LEVELS[request.urgency]?.color}`}>
                    {URGENCY_LEVELS[request.urgency]?.label || "Medium"} Priority
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm line-clamp-2 my-2">
                  {request.description}
                </p>
                
                {!isUserRequest && (
                  <div className="flex items-center text-xs text-gray-600 mt-2">
                    <span className="font-medium">Requested by: </span>
                    <span className="ml-1">{request.requesterId?.name}</span>
                  </div>
                )}
                
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <MapPinIcon className="w-3 h-3 mr-1" />
                  {request.location}
                </div>
                
                <div className="flex items-center text-xs mt-2">
                  <span className={`
                    px-2 py-1 rounded-full 
                    ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : ''}
                    ${request.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                    ${request.status === 'canceled' ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                  <span className="ml-2">{request.category}</span>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    {/* Action buttons based on request state */}
                    {isUserRequest && request.status === 'in-progress' && (
                      <button
                        onClick={() => onComplete(request._id)}
                        disabled={actionLoading}
                        className="flex items-center text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                      >
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Mark Complete
                      </button>
                    )}
                    
                    {isUserRequest && request.helperId && request.status !== 'completed' && (
                      <button
                        onClick={() => onMessage(request.helperId._id)}
                        className="flex items-center text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                        Message Helper
                      </button>
                    )}
                    
                    {isHelping && (
                      <button
                        onClick={() => onMessage(request.requesterId._id)}
                        className="flex items-center text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                        Message Requester
                      </button>
                    )}
                    
                    {isUserRequest && request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onEdit(request)}
                          className="flex items-center text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(request._id)}
                          className="flex items-center text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded"
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      </>
                    )}
                    
                    {!isUserRequest && !isHelping && request.status === 'pending' && (
                      <button
                        onClick={() => onOfferHelp(request._id)}
                        disabled={actionLoading}
                        className="flex items-center text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                      >
                        <HandRaisedIcon className="h-3 w-3 mr-1" />
                        Offer Help
                      </button>
                    )}
                    
                    <button
                      onClick={() => onViewDetails(request)}
                      className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// PropTypes for the presentation component
HelpRequestsList.propTypes = {
  requests: PropTypes.array.isRequired,
  title: PropTypes.string.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onOfferHelp: PropTypes.func.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  isUserRequest: PropTypes.bool,
  isHelping: PropTypes.bool,
  userData: PropTypes.object
};

// Main Component
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
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
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
      console.log("Form data being sent:", formData);
      console.log("Full error response:", err.response?.data);
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
  
  // Show add request form
  const handleAddRequest = () => {
    resetForm();
    setShowAddForm(!showAddForm);
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
  
  // Filter the help requests based on search query, category, and status
  const filteredRequests = helpRequests.filter(request => {
    const matchesSearch = 
      searchQuery === "" || 
      request.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      request.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      request.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "" || request.category === selectedCategory;
    
    const matchesStatus = filterStatus === "" || request.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
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
    <div>
    {/* Use EXACTLY the same container as Resources page */}
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Help Requests</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
          
          {/* Search and Filter Bar */}
          <SearchFilterBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            showCategoryDropdown={showCategoryDropdown}
            setShowCategoryDropdown={setShowCategoryDropdown}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            showFilterDropdown={showFilterDropdown}
            setShowFilterDropdown={setShowFilterDropdown}
            handleAddRequest={handleAddRequest}
            showAddForm={showAddForm}
            fetchHelpRequests={fetchHelpRequests}
            loading={loading}
          />
          
          {/* Request Form (Create/Edit) */}
          {showAddForm && (
            <RequestForm 
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              resetForm={resetForm}
              isEditing={isEditing}
              actionLoading={actionLoading}
            />
          )}

          {/* Main Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6 mt-6">
            <button
              onClick={() => setActiveMainTab('community')}
              className={`py-3 px-6 font-medium rounded-t-lg ${
                activeMainTab === 'community'
                  ? 'bg-white border border-gray-200 border-b-white text-blue-600'
                  : 'bg-gray-50 text-gray-600 hover:text-gray-900'
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
                    <div className="bg-gray-50 p-6 text-center text-gray-500 rounded">
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
                      <div className="flex border-b border-gray-200 mb-4">
                        <button 
                          onClick={() => setCommunityTab('all')}
                          className={`py-2 px-4 text-sm font-medium ${communityTab === 'all' 
                            ? 'border-b-2 border-blue-500 text-blue-600' 
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
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
                      <div className="space-y-4">
                        {filteredCommunityRequests.length === 0 ? (
                          <div className="bg-gray-50 p-4 text-center text-gray-500 rounded-lg">
                            No {communityTab !== 'all' ? communityTab : ''} community requests found.
                          </div>
                        ) : (
                          filteredCommunityRequests.map((request) => (
                            // Your existing community request card code
                            <div 
                              key={request._id} 
                              className={`rounded shadow-sm border overflow-hidden hover:shadow-md transition-shadow
                                ${request.status === 'pending' ? 'bg-white border-yellow-200' : ''}
                                ${request.status === 'in-progress' ? 'bg-blue-50 border-blue-200' : ''}
                                ${request.status === 'completed' ? 'bg-green-50 border-green-200' : ''}
                                ${request.status === 'canceled' ? 'bg-gray-50 border-gray-200' : ''}
                              `}
                            >
                              {/* Existing request card content */}
                              <div className="p-4">
                                {/* ...existing card content... */}
                                <div className="flex justify-between items-start">
                                  <h3 className="text-lg font-semibold">{request.title}</h3>
                                  <div className={`px-2 py-1 rounded-full text-xs ${URGENCY_LEVELS[request.urgency]?.color}`}>
                                    {URGENCY_LEVELS[request.urgency]?.label || "Medium"} Priority
                                  </div>
                                </div>
                                
                                <p className="text-gray-600 text-sm line-clamp-2 my-2">
                                  {request.description}
                                </p>
                                
                                <div className="flex items-center text-xs text-gray-600 mt-2">
                                  <span className="font-medium">Requested by: </span>
                                  <span className="ml-1">{request.requesterId?.name}</span>
                                </div>
                                
                                <div className="flex items-center text-xs text-gray-500 mt-2">
                                  <MapPinIcon className="w-3 h-3 mr-1" />
                                  {request.location}
                                </div>
                                
                                <div className="flex items-center text-xs mt-2">
                                  <span className={`
                                    px-2 py-1 rounded-full 
                                    ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                    ${request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : ''}
                                    ${request.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                                    ${request.status === 'canceled' ? 'bg-gray-100 text-gray-800' : ''}
                                  `}>
                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                  </span>
                                  <span className="ml-2">{request.category}</span>
                                </div>
                                
                                <div className="flex items-center justify-between mt-4">
                                  <span className="text-xs text-gray-500">
                                    {new Date(request.createdAt).toLocaleDateString()}
                                  </span>
                                  
                                  <div className="flex space-x-2">
                                    {/* Offer help button */}
                                    {request.status === 'pending' && (
                                      <button
                                        onClick={() => handleOfferHelp(request._id)}
                                        disabled={actionLoading}
                                        className="flex items-center text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                                      >
                                        <HandRaisedIcon className="h-3 w-3 mr-1" />
                                        Offer Help
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => handleViewDetails(request)}
                                      className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                                    >
                                      Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
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
                        <HelpRequestsList
                          requests={myRequests}
                          title="My Requests"
                          onViewDetails={handleViewDetails}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onMessage={handleMessage}
                          onComplete={handleCompleteRequest}
                          onOfferHelp={handleOfferHelp}
                          actionLoading={actionLoading}
                          isUserRequest={true}
                          userData={userData}
                        />
                      )}
                      
                      {/* Requests I'm helping with */}
                      {helpingRequests.length > 0 && (
                        <HelpRequestsList
                          requests={helpingRequests}
                          title="Requests I'm Helping With"
                          onViewDetails={handleViewDetails}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onMessage={handleMessage}
                          onComplete={handleCompleteRequest}
                          onOfferHelp={handleOfferHelp}
                          actionLoading={actionLoading}
                          isHelping={true}
                          userData={userData}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
              
              {/* Request Details Modal */}
              {showDetailsModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold">{selectedRequest.title}</h2>
                        <button 
                          onClick={() => setShowDetailsModal(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XCircleIcon className="h-6 w-6" />
                        </button>
                      </div>
                      
                      <div className="flex items-center mb-4">
                        <div className={`px-2 py-1 rounded-full text-xs ${URGENCY_LEVELS[selectedRequest.urgency]?.color}`}>
                          {URGENCY_LEVELS[selectedRequest.urgency]?.label || "Medium"} Priority
                        </div>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className={`
                          px-2 py-1 rounded-full text-xs
                          ${selectedRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${selectedRequest.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : ''}
                          ${selectedRequest.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          ${selectedRequest.status === 'canceled' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-700">Description</h3>
                        <p className="text-gray-600 mt-1">{selectedRequest.description}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-700">Category</h3>
                        <p className="text-gray-600 mt-1">{selectedRequest.category}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-700">Location</h3>
                        <p className="text-gray-600 mt-1">{selectedRequest.location}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-700">Posted by</h3>
                        <p className="text-gray-600 mt-1">{selectedRequest.requesterId?.name}</p>
                      </div>
                      
                      {selectedRequest.helperId && (
                        <div className="mb-4">
                          <h3 className="font-medium text-gray-700">Helper</h3>
                          <p className="text-gray-600 mt-1">{selectedRequest.helperId?.name}</p>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-700">Posted on</h3>
                        <p className="text-gray-600 mt-1">
                          {new Date(selectedRequest.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setShowDetailsModal(false)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          Close
                        </button>
                        
                        <div className="flex space-x-2">
                          {/* Show different actions based on user's relation to the request */}
                          {selectedRequest.requesterId?._id === userData?._id && selectedRequest.status === 'in-progress' && (
                            <button
                              onClick={() => {
                                handleCompleteRequest(selectedRequest._id);
                                setShowDetailsModal(false);
                              }}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
                            >
                              Mark as Completed
                            </button>
                          )}
                          
                          {selectedRequest.requesterId?._id !== userData?._id && 
                           selectedRequest.status === 'pending' && 
                           !selectedRequest.helperId && (
                            <button
                              onClick={() => {
                                handleOfferHelp(selectedRequest._id);
                                setShowDetailsModal(false);
                              }}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                            >
                              Offer Help
                            </button>
                          )}
                          
                          {/* Message buttons */}
                          {selectedRequest.helperId?._id === userData?._id && (
                            <button
                              onClick={() => {
                                handleMessage(selectedRequest.requesterId?._id);
                                setShowDetailsModal(false);
                              }}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center"
                            >
                              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                              Message Requester
                            </button>
                          )}
                          
                          {selectedRequest.requesterId?._id === userData?._id && selectedRequest.helperId && (
                            <button
                              onClick={() => {
                                handleMessage(selectedRequest.helperId?._id);
                                setShowDetailsModal(false);
                              }}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center"
                            >
                              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                              Message Helper
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
  );
}
