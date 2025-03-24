import { useState, useEffect, useContext, useCallback } from "react";
import {
  PlusCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon, // Add this missing import
  PlusIcon, // Add this missing import
  // ArrowPathIcon // TODO: Will be used for refresh functionality
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ResourceCard from "../components/resources/ResourceCard";
import BorrowRequests from "../components/resources/BorrowRequests";
import PropTypes from "prop-types";
import { toast } from 'react-toastify';

// Add these missing constants
// Fallback placeholder image
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";

// Server URL - make sure this matches your actual backend URL
const SERVER_URL = "http://localhost:5050";

// ===================
// ReviewModal Component
// ===================
const ReviewModal = ({
  currentTransaction,
  reviewData,
  setReviewData,
  setShowReviewModal,
  setCurrentTransaction,
  handleReviewSubmit,
  loading,
  currentUserId,
}) => {
  const [localComment, setLocalComment] = useState(reviewData?.comment || "");

  if (!currentTransaction) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setReviewData((prev) => ({ ...prev, comment: localComment }));
    handleReviewSubmit(e);
  };

  const reviewingOwner =
    currentTransaction.ownerId &&
    currentTransaction.ownerId._id &&
    currentTransaction.borrowerId &&
    currentTransaction.borrowerId._id === currentUserId;

  const personName = reviewingOwner
    ? currentTransaction.ownerId?.name || "the owner"
    : currentTransaction.borrowerId?.name || "the borrower";

  const resourceTitle = currentTransaction.resourceId?.title || "this resource";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Leave a Review</h2>
        <p className="mb-4 text-gray-600">
          {reviewingOwner
            ? `How was your experience borrowing ${resourceTitle} from ${personName}?`
            : `How was your experience with ${personName} borrowing ${resourceTitle}?`}
        </p>
        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-4">
            <p className="font-medium mb-2">Rating:</p>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewData({ ...reviewData, rating: star })}
                  className="text-yellow-400 focus:outline-none"
                >
                  {star <= reviewData.rating ? (
                    <StarIcon className="h-8 w-8" />
                  ) : (
                    <StarOutline className="h-8 w-8" />
                  )}
                </button>
              ))}
            </div>
          </div>
          {/* Comment */}
          <div className="mb-4">
            <label htmlFor="review-comment" className="block font-medium mb-2">
              Comments (optional):
            </label>
            <textarea
              id="review-comment"
              value={localComment}
              onChange={(e) => setLocalComment(e.target.value)}
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
              rows="3"
              placeholder="Share your experience..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowReviewModal(false);
                setCurrentTransaction(null);
              }}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#69C143] hover:bg-[#5DAF3B]"
              } text-white rounded-md`}
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ReviewModal.propTypes = {
  currentTransaction: PropTypes.object,
  reviewData: PropTypes.object.isRequired,
  setReviewData: PropTypes.func.isRequired,
  setShowReviewModal: PropTypes.func.isRequired,
  setCurrentTransaction: PropTypes.func.isRequired,
  handleReviewSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  currentUserId: PropTypes.string,
};

// ===================
// AddResourceModal Component
// ===================
const AddResourceModal = ({
  setShowAddModal,
  newResource,
  setNewResource,
  handleAddResource,
  loading,
  categoryOptions,
}) => {
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewResource((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Share a Resource</h2>
          <button
            onClick={() => setShowAddModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleAddResource} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Resource Title*"
              value={newResource.title}
              onChange={(e) =>
                setNewResource({ ...newResource, title: e.target.value })
              }
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <select
              value={newResource.category}
              onChange={(e) =>
                setNewResource({ ...newResource, category: e.target.value })
              }
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              required
            >
              <option value="">Select Category*</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Description*"
            value={newResource.description}
            onChange={(e) =>
              setNewResource({ ...newResource, description: e.target.value })
            }
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            rows="3"
          ></textarea>
          <input
            type="text"
            placeholder="Location*"
            value={newResource.location}
            onChange={(e) =>
              setNewResource({ ...newResource, location: e.target.value })
            }
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Resource Image
            </label>
            <input type="file" onChange={handleImageChange} className="mt-1" />
            {imagePreview && (
              <div className="mt-2 relative">
                <img
                  src={imagePreview}
                  alt="Resource preview"
                  className="w-full h-32 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setNewResource((prev) => ({ ...prev, image: null }));
                  }}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#69C143] hover:bg-[#5DAF3B] text-white px-4 py-2 rounded flex items-center transition"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              {loading ? "Adding..." : "Add Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AddResourceModal.propTypes = {
  setShowAddModal: PropTypes.func.isRequired,
  newResource: PropTypes.object.isRequired,
  setNewResource: PropTypes.func.isRequired,
  handleAddResource: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  categoryOptions: PropTypes.array.isRequired,
};

// ===================
// EditResourceModal Component
// ===================
const EditResourceModal = ({
  setShowEditModal,
  resourceToEdit,
  setResourceToEdit,
  handleUpdateResource,
  loading,
  categoryOptions,
}) => {
  const [previewImage, setPreviewImage] = useState(null);
  
  useEffect(() => {
    // Set the preview image if the resource has an image
    if (resourceToEdit?.image) {
      if (resourceToEdit.image.startsWith('http')) {
        setPreviewImage(resourceToEdit.image);
      } else {
        setPreviewImage(`${SERVER_URL}/uploads/${resourceToEdit.image.replace(/^uploads\//i, '')}`);
      }
    }
  }, [resourceToEdit]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResourceToEdit({
        ...resourceToEdit,
        image: file,
        newImageSelected: true // Flag to indicate a new image was selected
      });
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleUpdateResource();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">Edit Resource</h2>
          <button 
            onClick={() => setShowEditModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title*
              </label>
              <input
                type="text"
                value={resourceToEdit.title}
                onChange={(e) => setResourceToEdit({...resourceToEdit, title: e.target.value})}
                required
                className="w-full rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 focus:ring-green-500 focus:border-green-500"
                placeholder="What are you sharing?"
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description*
              </label>
              <textarea
                value={resourceToEdit.description}
                onChange={(e) => setResourceToEdit({...resourceToEdit, description: e.target.value})}
                required
                rows="3"
                className="w-full rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Describe your resource..."
              />
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category*
              </label>
              <select
                value={resourceToEdit.category}
                onChange={(e) => setResourceToEdit({...resourceToEdit, category: e.target.value})}
                required
                className="w-full rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select a category</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location*
              </label>
              <input
                type="text"
                value={resourceToEdit.location}
                onChange={(e) => setResourceToEdit({...resourceToEdit, location: e.target.value})}
                required
                className="w-full rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Where is this resource located?"
              />
            </div>
            
            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="edit-resource-image"
                />
                <label
                  htmlFor="edit-resource-image"
                  className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  {resourceToEdit.newImageSelected ? 'Change Image' : 'Replace Image'}
                </label>
                {previewImage && (
                  <div className="relative h-16 w-16 border rounded overflow-hidden">
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="h-full w-full object-cover"
                      onError={(e) => e.target.src = PLACEHOLDER_IMAGE}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setResourceToEdit({
                          ...resourceToEdit, 
                          image: null,
                          newImageSelected: false,
                          keepExistingImage: false
                        });
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Upload a photo of your resource (optional)
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-md shadow-sm hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditResourceModal.propTypes = {
  setShowEditModal: PropTypes.func.isRequired,
  resourceToEdit: PropTypes.object.isRequired,
  setResourceToEdit: PropTypes.func.isRequired,
  handleUpdateResource: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  categoryOptions: PropTypes.array.isRequired,
};

// ===================
// ResourceDetailsModal Component
// ===================
const ResourceDetailsModal = ({ resource, onClose, userData, onBorrow, onReturn, onOpenChat, loading }) => {
  if (!resource) return null;
  
  const isOwner = userData?._id === (
    typeof resource.ownerId === "object" ? resource.ownerId?._id : resource.ownerId
  );
  
  const isBorrower = userData?._id === (
    typeof resource.borrowedBy === "object" ? resource.borrowedBy?._id : resource.borrowedBy
  );
  
  // Helper function to safely generate image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return PLACEHOLDER_IMAGE;
    
    try {
      return typeof imagePath === 'string' && imagePath.startsWith('http') 
        ? imagePath 
        : `${SERVER_URL}/${imagePath.replace(/^\/+/, '')}`;
    } catch (err) {
      console.error("Error generating image URL:", err);
      return PLACEHOLDER_IMAGE;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="w-full md:w-2/5 h-64 md:h-auto bg-gray-200 dark:bg-gray-700 relative">
            {resource.image ? (
              <img 
                src={getImageUrl(resource.image)}
                alt={resource.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log("Image failed to load:", resource.image);
                  e.target.onerror = null;
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500">No image available</span>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="w-3/5 p-6 flex flex-col">
            <div className="flex justify-between">
              <div>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 ${
                  resource.availability === "available" 
                    ? "bg-green-100 text-green-800 border border-green-300" 
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}>
                  {resource.availability === "available" ? "Available" : isBorrower ? "Borrowed by you" : "Borrowed"}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{resource.title}</h2>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mt-4 flex items-center">
              <div className="flex items-center">
                {resource.ownerId?.profileImage ? (
                  <img src={resource.ownerId.profileImage} alt="" className="w-8 h-8 rounded-full mr-2" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 mr-2">
                    {resource.ownerId?.name?.[0] || "?"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {isOwner ? "You" : resource.ownerId?.name || "Unknown"}
                  </p>
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-300 ml-1">
                      {resource.ownerId?.trustScore?.toFixed(1) || "5.0"} ({resource.ownerId?.totalReviews || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex-grow">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Description</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{resource.description}</p>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-24">Category:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{resource.category}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-24">Location:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{resource.location}</span>
                </div>
                {resource.availability === "borrowed" && resource.borrowedBy && !isOwner && (
                  <div className="flex items-start">
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-24">Borrowed by:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {isBorrower ? "You" : resource.borrowedBy.name || "Someone"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              {!isOwner && (
                <>
                  {resource.availability === "available" ? (
                    <button
                      onClick={() => onBorrow(resource._id)}
                      disabled={loading || resource.pendingRequest}
                      className={`px-4 py-2 rounded text-white text-sm flex-1 flex items-center justify-center shadow-sm transition-colors ${
                        resource.pendingRequest 
                          ? "bg-gray-400 cursor-not-allowed" 
                          : "bg-[#69C143] hover:bg-[#5aad3a]"
                      }`}
                    >
                      {loading ? "Processing..." : resource.pendingRequest ? "Request Pending" : "Request to Borrow"}
                    </button>
                  ) : isBorrower ? (
                    <button
                      onClick={() => onReturn(resource._id)}
                      disabled={loading}
                      className="px-4 py-2 rounded text-white text-sm flex-1 bg-amber-500 hover:bg-amber-600 flex items-center justify-center shadow-sm transition-colors"
                    >
                      {loading ? "Processing..." : "Return"}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 rounded text-white text-sm flex-1 bg-gray-300 cursor-not-allowed shadow-sm"
                    >
                      Borrowed
                    </button>
                  )}
                </>
              )}
              
              {!isOwner && (
                <button
                  onClick={() => onOpenChat(resource.ownerId?._id, resource._id, resource.title)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center justify-center shadow-sm transition-colors"
                >
                  Message Owner
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ResourceDetailsModal.propTypes = {
  resource: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  userData: PropTypes.object,
  onBorrow: PropTypes.func.isRequired,
  onReturn: PropTypes.func.isRequired,
  onOpenChat: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
};

// ===================
// Main Resources Page Component
// ===================
export default function Resources() {
  const categoryOptions = [
    "Electronics",
    "Tools",
    "Books",
    "Furniture",
    "Household",
    "Clothing",
    "Kitchen",
    "Garden",
    "Sports",
    "Toys",
    "Other",
  ];

  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    availability: "available",
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingReviews, setPendingReviews] = useState({
    pendingAsOwner: [],
    pendingAsBorrower: [],
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [myResources, setMyResources] = useState([]);
  const [filterAvailability, setFilterAvailability] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [locationOptions, setLocationOptions] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);

  const { userData } = useContext(AuthContext);
  const currentUserId = userData?._id;
  const navigate = useNavigate();

  // Add tab management state
  const [activeTab, setActiveTab] = useState("community");

  const [showEditModal, setShowEditModal] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    image: null,
  });

  // Fetch resources (memoized)
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching resources...");
      const response = await API.get("/resources");
      console.log("Resource data received:", response.data?.length || 0, "items");
      if (response.data && Array.isArray(response.data)) {
        setResources(response.data);
        setError(null);
        const myRes = response.data.filter(
          (r) =>
            r.ownerId?._id === userData?._id || r.ownerId === userData?._id
        );
        setMyResources(myRes);
      } else {
        console.error("Invalid resource data format:", response.data);
        setError("Received invalid resource data from server");
      }
    } catch (err) {
      console.error("Error fetching resources:", err);
      setError("Failed to load resources: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [userData]);

  // Fetch pending reviews (memoized)
  const fetchPendingReviews = useCallback(async () => {
    if (!currentUserId) return;
    try {
      console.log("Fetching pending reviews for user:", currentUserId);
      const { data } = await API.get("/reviews/pending");
      if (data && typeof data === "object") {
        console.log("Pending reviews received:", data);
        setPendingReviews({
          pendingAsOwner: Array.isArray(data.pendingAsOwner)
            ? data.pendingAsOwner
            : [],
          pendingAsBorrower: Array.isArray(data.pendingAsBorrower)
            ? data.pendingAsBorrower
            : [],
        });
        if (
          !showReviewModal &&
          ((data.pendingAsOwner && data.pendingAsOwner.length > 0) ||
            (data.pendingAsBorrower && data.pendingAsBorrower.length > 0))
        ) {
          const firstReview = data.pendingAsBorrower[0] || data.pendingAsOwner[0];
          if (firstReview) {
            console.log("Auto-showing review modal for:", firstReview);
            setCurrentTransaction(firstReview);
            setShowReviewModal(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
      setPendingReviews({ pendingAsOwner: [], pendingAsBorrower: [] });
    }
  }, [currentUserId, showReviewModal]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    fetchPendingReviews();
  }, [fetchPendingReviews]);

  useEffect(() => {
    if (currentUserId) {
      fetchPendingReviews();
    }
  }, [resources, fetchPendingReviews, currentUserId]);

  // Handler for adding a resource
  const handleAddResource = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newResource.title.trim() || !newResource.description.trim()) {
        setError("Title and description are required");
        return;
      }
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append("title", newResource.title.trim());
        formData.append("description", newResource.description.trim());
        formData.append("category", newResource.category);
        formData.append("location", newResource.location.trim());
        formData.append("availability", "available");
        if (newResource.image) {
          formData.append("image", newResource.image);
        }
        const response = await API.post("/resources", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response.data) {
          setResources((prev) => [...prev, response.data]);
        }
        setNewResource({
          title: "",
          description: "",
          category: "",
          location: "",
          availability: "available",
          image: null,
        });
        setShowAddModal(false);
        setError(null);
      } catch (error) {
        console.error("Error adding resource:", error);
        setError("Error adding resource: " + error.message);
      } finally {
        setLoading(false);
      }
    },
    [newResource, fetchResources]
  );

  // Handler for toggling resource status (borrow/return)
  const handleToggleStatus = useCallback(
    async (updatedResource) => {
      try {
        setLoading(true);
        if (!updatedResource || !updatedResource._id) {
          console.error("Invalid resource data received:", updatedResource);
          throw new Error("Invalid resource data");
        }
        setResources((prev) =>
          prev.map((r) =>
            r._id === updatedResource._id ? { ...r, ...updatedResource } : r
          )
        );
        const response = await API.get(`/resources/${updatedResource._id}`);
        const fullResource = response.data;
        setResources((prev) =>
          prev.map((r) =>
            r._id === updatedResource._id ? fullResource : r
          )
        );
        if (updatedResource.availability === "available") {
          await fetchPendingReviews();
        }
        setError(null);
      } catch (error) {
        console.error("Error updating resource:", error);
        setError(error.response?.data?.message || "Failed to update resource");
        fetchResources();
      } finally {
        setLoading(false);
      }
    },
    [fetchPendingReviews, fetchResources]
  );

  // Handler for review submission
  const handleSubmitReview = useCallback(
    async (e) => {
      e.preventDefault();
      if (submittingReview) return;
      setSubmittingReview(true);
      try {
        console.log("Submitting review:", {
          transactionId: currentTransaction?._id,
          rating: reviewData.rating,
          comment: reviewData.comment,
        });
        const response = await API.post("/reviews", {
          transactionId: currentTransaction?._id,
          rating: reviewData.rating,
          comment: reviewData.comment,
        });
        console.log("Review submission successful:", response.data);
        setShowReviewModal(false);
        setReviewData({ rating: 5, comment: "" });
        setCurrentTransaction(null);
        await fetchPendingReviews();
        alert("Review submitted successfully!");
      } catch (error) {
        console.error("Error submitting review:", error);
        if (error.response?.status === 429) {
          alert("You're submitting reviews too quickly. Please wait a moment and try again.");
        } else {
          alert(error.response?.data?.message || "Failed to submit review. Please try again.");
        }
      } finally {
        setSubmittingReview(false);
      }
    },
    [currentTransaction, fetchPendingReviews, reviewData, submittingReview]
  );

  const handleOpenChat = useCallback(
    (ownerId, resourceId, resourceTitle) => {
      if (!ownerId) {
        console.error("Owner ID is required for messaging");
        return;
      }
      navigate(
        `/messages?to=${ownerId}&resource=${resourceId}&resourceTitle=${encodeURIComponent(resourceTitle)}`
      );
    },
    [navigate]
  );

  const handleDeleteResource = useCallback(
    async (resourceId) => {
      if (!resourceId) {
        console.error("No resource ID provided for deletion");
        return;
      }
      try {
        setLoading(true);
        setResources((prev) => prev.filter((r) => r._id !== resourceId));
        await API.delete(`/resources/${resourceId}`);
        setError(null);
      } catch (error) {
        console.error("Error deleting resource:", error);
        setError("Failed to delete resource: " + error.message);
        fetchResources();
      } finally {
        setLoading(false);
      }
    },
    [fetchResources]
  );

  const handleShowReviewModal = useCallback((transaction) => {
    console.log("Opening review modal for transaction:", transaction);
    setCurrentTransaction(transaction);
    setShowReviewModal(true);
  }, []);

  const handleViewResourceDetails = useCallback((resource) => {
    setSelectedResource(resource);
  }, []);

  const handleCloseResourceDetails = useCallback(() => {
    setSelectedResource(null);
  }, []);

  const handleBorrowResource = useCallback(async (resourceId) => {
    try {
      setLoading(true);
      const response = await API.post(`/resources/${resourceId}/borrow`);
      handleToggleStatus(response.data);
      setSelectedResource(null);
    } catch (error) {
      console.error("Error borrowing resource:", error);
      setError("Failed to borrow resource: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [handleToggleStatus]);

  const handleReturnResource = useCallback(async (resourceId) => {
    try {
      setLoading(true);
      const response = await API.post(`/resources/${resourceId}/return`);
      handleToggleStatus(response.data);
      setSelectedResource(null);
    } catch (error) {
      console.error("Error returning resource:", error);
      setError("Failed to return resource: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [handleToggleStatus]);

  const handleEditResource = (resource) => {
    // Convert resource object to a format suitable for editing
    setResourceToEdit({
      _id: resource._id,
      title: resource.title || "",
      description: resource.description || "",
      category: resource.category || "",
      location: resource.location || "",
      image: resource.image || null,
      keepExistingImage: true, // Flag to indicate we should keep the existing image if no new one is selected
    });
    setShowEditModal(true);
  };

  const handleUpdateResource = useCallback(async () => {
    if (!resourceToEdit._id) {
      setError("Invalid resource data");
      return;
    }
    
    try {
      setLoading(true);
      
      // Create a FormData object for the multipart request if there's an image
      const formData = new FormData();
      formData.append("title", resourceToEdit.title.trim());
      formData.append("description", resourceToEdit.description.trim());
      formData.append("category", resourceToEdit.category.trim());
      formData.append("location", resourceToEdit.location.trim());
      
      // Handle the image - only append if a new image was selected
      if (resourceToEdit.newImageSelected && resourceToEdit.image) {
        formData.append("image", resourceToEdit.image);
      } else {
        // If keeping the existing image, tell the backend not to change it
        formData.append("keepExistingImage", resourceToEdit.keepExistingImage.toString());
      }
      
      const response = await API.put(`/resources/${resourceToEdit._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (response.data) {
        // Update the resources array with the updated resource
        setResources((prev) => 
          prev.map((r) => r._id === response.data._id ? response.data : r)
        );
        
        // Close the modal and reset the form
        setShowEditModal(false);
        setResourceToEdit({
          title: "",
          description: "",
          category: "",
          location: "",
          image: null,
        });
        
        setError(null);
        // Show success notification
        toast.success("Resource updated successfully");
      }
    } catch (error) {
      console.error("Error updating resource:", error);
      setError("Error updating resource: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [resourceToEdit]);

  // Filter resources based on search query and selected category
  const filteredResources = resources.filter((resource) => {
    // Match search query
    const matchesQuery =
      searchQuery.trim() === "" ||
      (resource.title && resource.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (resource.location && resource.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Match category filter
    const matchesCategory =
      filterCategory === "" || resource.category === filterCategory;
    
    // Match availability filter
    const matchesAvailability =
      filterAvailability === "" || resource.availability === filterAvailability;
    
    // Match location filter
    const matchesLocation =
      filterLocation === "" || (resource.location && resource.location === filterLocation);
    
    return matchesQuery && matchesCategory && matchesAvailability && matchesLocation;
  });

  // Separate resources owned by the user vs. community resources
  const myResourcesFiltered = filteredResources.filter(
    (r) => r.ownerId?._id === userData?._id
  );

  const otherResourcesFiltered = filteredResources.filter(
    (r) => r.ownerId?._id !== userData?._id
  );

  // Debug logging
  useEffect(() => {
    console.log("Resources component state:", {
      loading,
      resourcesCount: resources?.length || 0,
      myResourcesCount: myResources?.length || 0,
      otherResourcesCount: otherResourcesFiltered?.length || 0,
      hasUserData: !!userData,
      searchQuery,
      filterCategory,
    });
  }, [loading, resources, myResources, otherResourcesFiltered, userData, searchQuery, filterCategory]);

  useEffect(() => {
    // Extract unique locations from resources
    if (resources && resources.length > 0) {
      const locations = Array.from(new Set(
        resources
          .map(r => r.location)
          .filter(Boolean)
      ));
      setLocationOptions(locations);
    }
  }, [resources]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCategory("");
    setFilterAvailability("");
    setFilterLocation("");
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Resource Sharing</h1>
        
        {/* Modified to always show regardless of active tab */}
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-4 py-2 rounded-md flex items-center justify-center shadow-sm transition-all transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Share Resource
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Top search and category filters - keep at top */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col space-y-4">
          {/* Search and Category */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources by title, description or location..."
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
            
            <div className="relative w-full md:w-48">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md py-2 px-4 pr-8 focus:ring-green-500 focus:border-green-500 dark:text-white"
              >
                <option value="">All Categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <ChevronDownIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
          
          {/* Active filters display */}
          {(searchQuery || filterCategory) && (
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
              {filterCategory && (
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded dark:bg-green-900/50 dark:text-green-300">
                  Category: {filterCategory}
                  <button onClick={() => setFilterCategory("")} className="ml-1 text-green-500 dark:text-green-300">
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
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
              Community Resources
              {otherResourcesFiltered.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  {otherResourcesFiltered.length}
                </span>
              )}
            </button>
          </li>
          {userData && (
            <li className="mr-2">
              <button
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === "myResources"
                    ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400 active"
                    : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("myResources")}
              >
                My Resources
                {myResourcesFiltered.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    {myResourcesFiltered.length}
                  </span>
                )}
              </button>
            </li>
          )}
        </ul>
      </div>
      
      {/* Availability and Location filters - moved below tabs */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Availability
            </label>
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md py-2 px-3 focus:ring-green-500 focus:border-green-500 dark:text-white"
            >
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="borrowed">Borrowed</option>
            </select>
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md py-2 px-3 focus:ring-green-500 focus:border-green-500 dark:text-white"
            >
              <option value="">All Locations</option>
              {locationOptions.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          {(filterAvailability || filterLocation) && (
            <div className="flex items-end col-span-2">
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center my-8 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#69C143]"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading resources...</span>
        </div>
      ) : (
        <>
          {/* Tab Content */}
          {/* Community Resources Tab */}
          {activeTab === "community" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300">Community Resources</h2>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Resources shared by community members</p>
                  </div>
                </div>
              </div>
              
              {otherResourcesFiltered.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-5 text-center border border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No resources match your current criteria</p>
                  {(searchQuery || filterCategory || filterAvailability || filterLocation) && (
                    <button 
                      onClick={clearFilters}
                      className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {otherResourcesFiltered.map((resource) => (
                    <ResourceCard
                      key={resource._id}
                      resource={resource}
                      userData={userData}
                      onUpdate={handleToggleStatus}
                      onOpenChat={handleOpenChat}
                      onShowReviewModal={handleShowReviewModal}
                      onViewDetails={() => handleViewResourceDetails(resource)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* My Resources Tab */}
          {activeTab === "myResources" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6z" />
                      <path fillRule="evenodd" d="M8 10a6 6 0 016 6H2a6 6 0 016-6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-green-800 dark:text-green-300">My Resources</h2>
                    <p className="text-xs text-green-600 dark:text-green-400">Resources you have shared with the community</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="text-sm flex items-center text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md shadow-sm transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Resource
                </button>
              </div>
              
              {/* Always show BorrowRequests component in My Resources tab */}
              <div className="mb-8">
                <BorrowRequests onRequestProcessed={fetchResources} />
              </div>
              
              {/* Existing pending reviews section can remain if needed */}
              {pendingReviews && 
                (pendingReviews.pendingAsOwner?.length > 0 || 
                pendingReviews.pendingAsBorrower?.length > 0) && (
                <div className="mb-8">
                  {/* Any pending reviews UI */}
                </div>
              )}
              
              {myResourcesFiltered.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">You have not shared any resources yet. Add one to help the community!</p>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    Share your first resource
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {myResourcesFiltered.map((resource) => (
                    <ResourceCard
                      key={resource._id}
                      resource={resource}
                      userData={userData}
                      onUpdate={handleToggleStatus}
                      onOpenChat={handleOpenChat}
                      onDelete={handleDeleteResource}
                      onShowReviewModal={handleShowReviewModal}
                      onViewDetails={() => handleViewResourceDetails(resource)}
                      onEdit={handleEditResource}  // Add this new prop
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Existing modals remain the same */}
      {showAddModal && (
        <AddResourceModal
          setShowAddModal={setShowAddModal}
          newResource={newResource}
          setNewResource={setNewResource}
          handleAddResource={handleAddResource}
          loading={loading}
          categoryOptions={categoryOptions}
        />
      )}
      {showReviewModal && (
        <ReviewModal
          currentTransaction={currentTransaction}
          reviewData={reviewData}
          setReviewData={setReviewData}
          setShowReviewModal={setShowReviewModal}
          setCurrentTransaction={setCurrentTransaction}
          handleReviewSubmit={handleSubmitReview}
          loading={submittingReview}
          currentUserId={currentUserId}
        />
      )}
      {selectedResource && (
        <ResourceDetailsModal
          resource={selectedResource}
          onClose={handleCloseResourceDetails}
          userData={userData}
          onBorrow={handleBorrowResource}
          onReturn={handleReturnResource}
          onOpenChat={handleOpenChat}
          loading={loading}
        />
      )}
      {showEditModal && (
        <EditResourceModal
          setShowEditModal={setShowEditModal}
          resourceToEdit={resourceToEdit}
          setResourceToEdit={setResourceToEdit}
          handleUpdateResource={handleUpdateResource}
          loading={loading}
          categoryOptions={categoryOptions}
        />
      )}

      {/* Add CSS for improved card styling */}
      <style>{`
        .resource-card {
          box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.08);
          padding: 12px;
          border-radius: 8px;
          transition: transform 0.2s ease-in-out;
        }
        
        .resource-card:hover {
          transform: scale(1.02);
        }
        
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  );
}