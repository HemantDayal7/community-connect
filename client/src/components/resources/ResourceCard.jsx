import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  ChatBubbleLeftIcon,
  StarIcon,
  TrashIcon,
  UserIcon,
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
}) {
  // Component state management
  const isMounted = useRef(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState(null);
  
  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // FIXED: Improved image URL construction
  useEffect(() => {
    // Skip if resource or image is missing
    if (!resource?.image) {
      setFinalImageUrl(null);
      setImageLoading(false);
      setImageError(false);
      return;
    }

    try {
      console.log(`📷 Processing image for "${resource.title || 'Untitled resource'}"`);
      console.log(`   Original image path: "${resource.image}"`);
      
      // Case 1: If it's already a complete URL, use it directly
      if (/^https?:\/\//i.test(resource.image)) {
        console.log(`   Using full URL directly: ${resource.image}`);
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
      
      console.log(`   Extracted filename: "${imageFilename}"`);
      
      // FIXED: Add cache-busting parameter to prevent browser caching issues
      // This is critical for solving intermittent image loading problems
      const timestamp = new Date().getTime();
      const url = `${SERVER_URL}/uploads/${imageFilename}?_t=${timestamp}`;
      
      console.log(`   Final image URL: ${url}`);
      
      setFinalImageUrl(url);
      setImageLoading(true);
      setImageError(false);
    } catch (error) {
      console.error(`❌ Error processing image for "${resource?.title}":`, error);
      setFinalImageUrl(null);
      setImageLoading(false);
      setImageError(true);
    }
  }, [resource?.image, resource?.title]);

  // FIXED: Improved error handling for image loading
  const handleImageLoadError = () => {
    console.error(`❌ Image failed to load: ${finalImageUrl}`);
    
    // Create a direct URL for debugging purposes
    let debugUrl = '';
    
    try {
      if (resource?.image) {
        // Get just the filename
        let filename = resource.image;
        if (filename.includes('/')) {
          filename = filename.split('/').pop();
        }
        
        debugUrl = `${SERVER_URL}/uploads/${filename}`;
        console.log(`🔍 Debug: Try this direct URL in a new tab: ${debugUrl}`);
      }
    } catch (err) {
      console.error('Error creating debug URL:', err);
    }
    
    // Update state to show placeholder image
    if (isMounted.current) {
      setImageLoading(false);
      setImageError(true);
    }
  };

  // Early return if resource is missing
  if (!resource) {
    return <div className="border rounded-lg bg-gray-100 p-4">No resource data available</div>;
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
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Image Section with enhanced error handling */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {finalImageUrl && !imageError ? (
          <>
            {/* Loading spinner */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
              </div>
            )}
            {/* FIXED: Modified image with proper loading and error handling */}
            <img
              src={finalImageUrl}
              alt={resource.title || "Resource"}
              className="w-full h-full object-cover"
              onLoad={() => {
                console.log(`✅ Image loaded successfully for: "${resource.title}"`);
                if (isMounted.current) setImageLoading(false);
              }}
              onError={handleImageLoadError}
              crossOrigin="anonymous" // FIXED: Add crossOrigin to prevent CORS issues
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gray-100 text-gray-400">
            <img
              src={PLACEHOLDER_IMAGE}
              alt="Placeholder"
              className="w-full h-full object-cover"
            />
            {resource.image && (
              <div className="absolute bottom-0 left-0 right-0 bg-red-100 text-red-700 text-xs p-1 text-center">
                Cannot load image: {resource.image}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Title & Availability */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg mr-2">
            {resource.title || "Untitled"}
          </h3>
          <span className={`text-sm px-2 py-1 rounded ${availabilityClasses}`}>
            {availabilityLabel}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3">
          {resource.description || "No description"}
        </p>

        {/* Category & Location */}
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-3">
          <p>
            <strong>Category:</strong> {resource.category || "Uncategorized"}
          </p>
          <p>
            <strong>Location:</strong> {resource.location || "Unknown"}
          </p>
        </div>

        {/* Owner & Trust Score */}
        <div className="flex items-center mb-4">
          <p className="text-sm">
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
          <div className="mb-4 p-2 bg-blue-50 rounded-md flex items-center">
            <UserIcon className="h-4 w-4 text-blue-500 mr-2" />
            <p className="text-sm text-blue-700">
              Borrowed by:{" "}
              <span className="font-medium">
                {resource.borrowedBy?.name || "Unknown user"}
              </span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-4">
          {isOwner ? (
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-2 rounded text-white text-sm flex-1 flex items-center justify-center bg-red-600 hover:bg-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              {actionLoading ? "Processing..." : "Delete Resource"}
            </button>
          ) : (
            <>
              {resource.availability === "available" ? (
                <button
                  onClick={handleBorrow}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded text-white text-sm flex-1 bg-blue-600 hover:bg-blue-500"
                >
                  {actionLoading ? "Processing..." : "Request to Borrow"}
                </button>
              ) : isBorrower ? (
                <button
                  onClick={handleReturn}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded text-white text-sm flex-1 bg-amber-500 hover:bg-amber-600"
                >
                  {actionLoading ? "Processing..." : "Return"}
                </button>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 rounded text-white text-sm flex-1 bg-gray-300 cursor-not-allowed"
                >
                  Borrowed
                </button>
              )}

              <button
                onClick={() =>
                  onOpenChat &&
                  onOpenChat(resource.ownerId?._id, resource._id, resource.title)
                }
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex-1 flex items-center justify-center"
              >
                <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                Message
              </button>
            </>
          )}
        </div>
      </div>
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
};