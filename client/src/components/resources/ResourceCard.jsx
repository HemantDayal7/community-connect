import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  ChatBubbleLeftIcon,
  StarIcon,
  TrashIcon,
  UserIcon,
  ArrowPathIcon, // Added missing import
} from "@heroicons/react/24/solid";
import API from "../../services/api";

// Fallback placeholder image
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";

// Server URL - make sure this matches your actual backend URL
const SERVER_URL = "http://localhost:5050";

export default function ResourceCard({
  resource,
  userData,
  onUpdate,
  onOpenChat,
  onDelete,
  onShowReviewModal,
  onViewDetails, // Added for detailed view functionality
  onEdit, // Add this new prop
}) {
  // Component state management
  const isMounted = useRef(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Improved image URL construction
  useEffect(() => {
    // Skip if resource or image is missing
    if (!resource?.image) {
      setFinalImageUrl(null);
      setImageLoading(false);
      setImageError(false);
      return;
    }

    try {
      // Production code should have minimal logging
      // console.log(`📷 Processing image for "${resource.title || 'Untitled resource'}"`);
      
      // Case 1: If it's already a complete URL, use it directly
      if (/^https?:\/\//i.test(resource.image)) {
        setFinalImageUrl(resource.image);
        setImageLoading(true);
        setImageError(false);
        return;
      }

      // Case 2: Direct filename with explicit handling
      // Extract only the filename regardless of how it's stored in the database
      let imageFilename;
      
      // Remove any uploads/ prefix if present
      let processedPath = resource.image.replace(/^uploads\//i, '');
      
      // Get just the filename part
      if (processedPath.includes('/')) {
        imageFilename = processedPath.split('/').pop();
      } else {
        imageFilename = processedPath;
      }
      
      // Add cache-busting parameter to prevent browser caching issues
      const timestamp = new Date().getTime();
      const url = `${SERVER_URL}/uploads/${imageFilename}?_t=${timestamp}`;
      
      setFinalImageUrl(url);
      setImageLoading(true);
      setImageError(false);
    } catch (error) {
      console.error(`Error processing image for "${resource?.title}":`, error);
      setFinalImageUrl(null);
      setImageLoading(false);
      setImageError(true);
    }
  }, [resource?.image, resource?.title]);

  // Improved error handling for image loading
  const handleImageLoadError = () => {
    console.error(`Image failed to load: ${finalImageUrl}`);
    
    // Update state to show placeholder image
    if (isMounted.current) {
      setImageLoading(false);
      setImageError(true);
    }
  };

  // Early return if resource is missing
  if (!resource) {
    return <div className="border rounded-lg bg-gray-100 dark:bg-gray-700 p-4 text-gray-500 dark:text-gray-400">No resource data available</div>;
  }

  // Determine user relationships
  const isOwner = userData?._id === (
    typeof resource.ownerId === "object" ? resource.ownerId?._id : resource.ownerId
  );
  
  const isBorrower = userData?._id === (
    typeof resource.borrowedBy === "object" ? resource.borrowedBy?._id : resource.borrowedBy
  );

  // Format trust score with default of 5.0
  const trustScore = resource.ownerId?.trustScore
    ? Math.min(parseFloat(resource.ownerId.trustScore) || 5, 5).toFixed(1)
    : "5.0";

  // Determine availability label and styling
  let availabilityLabel = "Available";
  let availabilityClasses = "bg-green-100 text-green-800";
  if (resource.availability === "borrowed") {
    availabilityLabel = isBorrower ? "Borrowed by you" : "Borrowed";
    availabilityClasses = "bg-amber-100 text-amber-800";
  }

  // Action handlers
  async function handleBorrow() {
    if (!userData?._id) {
      alert("Please log in to borrow resources");
      return;
    }
    setActionLoading(true);
    try {
      await API.post("/resources/borrow-request", { resourceId: resource._id });
      alert("Borrow request sent! Waiting for owner approval.");
      onUpdate && onUpdate();
    } catch (err) {
      console.error("Borrow request error:", err);
      alert(err.response?.data?.message || "Failed to send borrow request");
    } finally {
      if (isMounted.current) setActionLoading(false);
    }
  }

  async function handleReturn() {
    if (!userData?._id) {
      alert("Please log in to return resources");
      return;
    }
    setActionLoading(true);
    try {
      const resp = await API.put(`/resources/return/${resource._id}`);
      alert("Resource returned successfully!");
      onUpdate && onUpdate();
      if (resp.data?.transaction && onShowReviewModal) {
        onShowReviewModal(resp.data.transaction);
      }
    } catch (err) {
      console.error("Return resource error:", err);
      alert(err.response?.data?.message || "Failed to return resource");
    } finally {
      if (isMounted.current) setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!userData?._id) {
      alert("Please log in to delete resources");
      return;
    }
    if (!window.confirm(`Delete "${resource.title}"?`)) return;
    
    setActionLoading(true);
    try {
      await API.delete(`/resources/${resource._id}`);
      onDelete && onDelete(resource._id);
    } catch (err) {
      console.error("Delete resource error:", err);
      alert(err.response?.data?.message || "Failed to delete resource");
    } finally {
      if (isMounted.current) setActionLoading(false);
    }
  }

  return (
    <div 
      className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col relative resource-card"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Image Section with enhanced error handling */}
      <div 
        className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden cursor-pointer"
        onClick={() => onViewDetails && onViewDetails(resource)}
      >
        {finalImageUrl && !imageError ? (
          <>
            {/* Loading spinner */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-70 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 dark:border-green-400" />
              </div>
            )}
            {/* Image with proper loading and error handling */}
            <img
              src={finalImageUrl}
              alt={resource.title || "Resource"}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
              onLoad={() => {
                if (isMounted.current) setImageLoading(false);
              }}
              onError={handleImageLoadError}
              crossOrigin="anonymous"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
            <img
              src={PLACEHOLDER_IMAGE}
              alt="Placeholder"
              className="w-full h-full object-cover"
            />
            {resource.image && imageError && (
              <div className="absolute bottom-0 left-0 right-0 bg-red-100 dark:bg-red-900/70 text-red-700 dark:text-red-300 text-xs p-1 text-center">
                Image unavailable
              </div>
            )}
          </div>
        )}
        
        {/* View details overlay hint */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
          <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            View Details
          </span>
        </div>
      </div>

      {/* Card Content - add flex-grow to ensure consistent height */}
      <div className="p-4 flex flex-col flex-grow dark:text-white">
        {/* Title & Availability */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg mr-2 dark:text-white">
            {resource.title || "Untitled"}
          </h3>
          <span className={`text-sm px-2 py-1 rounded ${availabilityClasses} dark:bg-opacity-20`}>
            {availabilityLabel}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
          {resource.description || "No description"}
        </p>

        {/* Category & Location */}
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <p>
            <strong>Category:</strong> {resource.category || "Uncategorized"}
          </p>
          <p>
            <strong>Location:</strong> {resource.location || "Unknown"}
          </p>
        </div>

        {/* Owner & Trust Score */}
        <div className="flex items-center mb-4">
          <p className="text-sm dark:text-gray-300">
            <strong>Owner:</strong>{" "}
            <span className="font-medium">
              {isOwner ? "You" : resource.ownerId?.name || "Unknown"}
            </span>
            <span className="inline-block ml-2 text-yellow-500">
              <StarIcon className="h-4 w-4 inline" /> {trustScore}/5
            </span>
          </p>
        </div>

        {/* Borrower info */}
        {isOwner && resource.availability === "borrowed" && resource.borrowedBy && (
          <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md flex items-center">
            <UserIcon className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Borrowed by:{" "}
              <span className="font-medium">
                {resource.borrowedBy?.name || "Unknown user"}
              </span>
            </p>
          </div>
        )}

        {/* Availability Badge */}
        <div className="flex items-center mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            resource.availability === "available" 
              ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" 
              : "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
          }`}>
            {availabilityLabel}
          </span>
          
          {/* Add a pending indicator if applicable */}
          {resource.pendingRequest && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
              Request Pending
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-auto pt-4">
          {isOwner ? (
            <div className="flex space-x-2 w-full">
              <button
                onClick={() => onEdit && onEdit(resource)}
                disabled={actionLoading}
                className="px-4 py-2 rounded text-white text-sm flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded text-white text-sm flex-1 flex items-center justify-center bg-red-600 hover:bg-red-500 transition-colors shadow-sm disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          ) : (
            <>
              {resource.availability === "available" ? (
                <button
                  onClick={handleBorrow}
                  disabled={actionLoading || resource.pendingRequest}
                  className={`px-4 py-2 rounded text-white text-sm flex-1 flex items-center justify-center shadow-sm transition-colors ${
                    resource.pendingRequest || actionLoading
                      ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed" 
                      : "bg-[#69C143] hover:bg-[#5aad3a]"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                  </svg>
                  {actionLoading ? "Processing..." : resource.pendingRequest ? "Request Pending" : "Request to Borrow"}
                </button>
              ) : isBorrower ? (
                <button
                  onClick={handleReturn}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded text-white text-sm flex-1 bg-amber-500 hover:bg-amber-600 flex items-center justify-center shadow-sm transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  {actionLoading ? "Processing..." : "Return"}
                </button>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 rounded text-white text-sm flex-1 bg-gray-300 dark:bg-gray-600 cursor-not-allowed shadow-sm"
                >
                  Borrowed
                </button>
              )}

              <button
                onClick={() => onOpenChat && onOpenChat(resource.ownerId?._id, resource._id, resource.title)}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center justify-center shadow-sm transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                Message
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Tooltip that appears on hover */}
      {showTooltip && (
        <div className="absolute top-full left-0 right-0 bg-gray-800 text-white p-3 rounded-b-lg text-sm z-10 shadow-lg">
          <p className="mb-1"><strong>Owner:</strong> {isOwner ? "You" : resource.ownerId?.name || "Unknown"}</p>
          <p className="mb-1"><strong>Trust Score:</strong> {trustScore}/5</p>
          <p className="mb-1"><strong>Location:</strong> {resource.location || "Not specified"}</p>
          {resource.availability === "borrowed" && resource.borrowedBy && (
            <p><strong>Borrowed by:</strong> {resource.borrowedBy.name || "Unknown user"}</p>
          )}
        </div>
      )}
    </div>
  );
}

ResourceCard.propTypes = {
  resource: PropTypes.object.isRequired,
  userData: PropTypes.object,
  onUpdate: PropTypes.func,
  onOpenChat: PropTypes.func,
  onDelete: PropTypes.func,
  onShowReviewModal: PropTypes.func,
  onViewDetails: PropTypes.func, // Added new prop for viewing details
  onEdit: PropTypes.func, // Add this new prop type
};