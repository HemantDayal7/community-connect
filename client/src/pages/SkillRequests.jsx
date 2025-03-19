// src/pages/SkillRequests.jsx
import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  MapPinIcon
} from "@heroicons/react/24/outline";
import Spinner from "../components/ui/Spinner";
import MainLayout from "../components/layout/MainLayout";
import PropTypes from "prop-types";
import SkillReviewModal from "../components/skills/SkillReviewModal";

// Main component for listing skill requests
export default function SkillRequests() {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Fetch pending reviews to check which ones need reviews
  const [pendingReviews, setPendingReviews] = useState({
    pendingAsRequester: [],
    pendingAsProvider: []
  });

  // Fetch requests on component mount
  useEffect(() => {
    if (userData && userData._id) {
      fetchRequests();
      fetchPendingReviews();
    }
  }, [userData]);

  // Fetch skill requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.get("/skillrequests");
      console.log("Received skill requests:", response.data);
      setRequests(response.data || []);
    } catch (err) {
      console.error("Error fetching skill requests:", err);
      setError(err.response?.data?.message || "Failed to load skill requests");
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending reviews
  const fetchPendingReviews = async () => {
    try {
      const response = await API.get("/skillreviews/pending");
      if (response.data.success) {
        setPendingReviews({
          pendingAsRequester: response.data.pendingAsRequester || [],
          pendingAsProvider: response.data.pendingAsProvider || []
        });
      }
    } catch (err) {
      console.error("Error fetching pending reviews:", err);
    }
  };

  // Respond to a request (accept/reject)
  const handleRespond = async (requestId, newStatus) => {
    try {
      setActionLoading(true);
      
      const response = await API.put(`/skillrequests/${requestId}/respond`, {
        status: newStatus
      });
      
      if (response.data?.success) {
        toast.success(`Request ${newStatus} successfully!`);
        
        setRequests(prevRequests => 
          prevRequests.map(req => 
            req._id === requestId ? response.data.request : req
          )
        );
      } else {
        toast.info("Request updated, but received unexpected response format");
        fetchRequests();
      }
    } catch (err) {
      console.error(`Error ${newStatus} request:`, err);
      toast.error(err.response?.data?.message || `Failed to ${newStatus} request`);
    } finally {
      setActionLoading(false);
    }
  };

  // Mark a request as completed
  const handleComplete = async (requestId) => {
    try {
      setActionLoading(true);
      const response = await API.put(`/skillrequests/${requestId}/complete`);

      // Updated to check for the correct success flag
      if (response.status === 200) {
        toast.success("Request marked as completed!");
        
        // Update local state
        setRequests(prevRequests =>
          prevRequests.map(req => (req._id === requestId 
            ? { ...req, status: "completed" } 
            : req
          ))
        );
        
        // Refresh pending reviews since completion creates review opportunities
        fetchPendingReviews();
        
        // Also update the skill availability if it's in the local state
        fetchRequests(); // Optional: refetch all requests to ensure consistency
      } else {
        console.warn("Unexpected response format:", response);
        toast.info("Request status updated. Please refresh to see changes.");
        fetchRequests();
      }
    } catch (err) {
      console.error("Error completing request:", err);
      toast.error(err.response?.data?.message || "Failed to mark request as completed");
      
      // Log the full error for debugging
      console.log("Full error object:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Enhanced handleMessage function
  const handleMessage = (userId, requestId, skillTitle, status) => {
    navigate(`/messages?with=${userId}&contextType=skill_request&contextId=${requestId}&skillTitle=${encodeURIComponent(skillTitle)}&requestStatus=${encodeURIComponent(status)}`);
  };
  
  // Open review modal
  const handleOpenReviewModal = (request) => {
    // Check if the skill still exists
    if (!request.skillId || request.skillId._id === "deleted") {
      toast.error("Cannot review a deleted skill");
      return;
    }
    
    setCurrentRequest(request);
    setReviewData({ rating: 5, comment: "" });
    setShowReviewModal(true);
  };
  
  // Handle review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (submittingReview || !currentRequest) return;
    
    setSubmittingReview(true);
    try {
      const response = await API.post("/skillreviews", {
        requestId: currentRequest._id,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      
      console.log("Review submission successful:", response.data);
      setShowReviewModal(false);
      setReviewData({ rating: 5, comment: "" });
      setCurrentRequest(null);
      
      // Refresh pending reviews and requests
      await fetchPendingReviews();
      await fetchRequests();
      toast.success("Review submitted successfully!");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Update the needsReviewFromUser function to check if the skill exists

const needsReviewFromUser = (request) => {
  // Don't show review option if skill has been deleted
  if (!request.skillId || request.skillId === null || request.skillId === "deleted") {
    return false;
  }
  
  if (request.status !== "completed") return false;
  
  const isRequester = request.requesterId?._id === userData?._id;
  const isProvider = request.providerId?._id === userData?._id;
  
  if (isRequester && !request.requesterReviewed) return true;
  if (isProvider && !request.providerReviewed) return true;
  
  return false;
};

  // Split requests into "sent" vs. "received"
  const sentRequests = requests.filter(
    (req) => req.requesterId && req.requesterId._id === userData?._id
  );
  const receivedRequests = requests.filter(
    (req) => req.providerId && req.providerId._id === userData?._id
  );

  return (
    <MainLayout userData={userData}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Skill Requests</h1>
          <div className="flex space-x-2">
            <Link
              to="/skillsharing"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Back to Skills
            </Link>
            <button
              onClick={fetchRequests}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded"
              title="Refresh requests"
              disabled={loading || actionLoading}
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Pending Reviews Section */}
        {(pendingReviews.pendingAsRequester.length > 0 || pendingReviews.pendingAsProvider.length > 0) && (
          <div className="mb-8 bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h2 className="text-lg font-medium mb-3">Pending Reviews</h2>
            
            {pendingReviews.pendingAsRequester.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-amber-700 mb-2">
                  Skills You Received
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingReviews.pendingAsRequester.map((request) => (
                    <div key={request._id} className="bg-white p-3 rounded border border-amber-100 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{request.skillId?.title}</p>
                        <p className="text-sm text-gray-600">Provider: {request.providerId?.name}</p>
                      </div>
                      <button
                        onClick={() => handleOpenReviewModal(request)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded flex items-center"
                      >
                        <StarIcon className="h-4 w-4 mr-1" />
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {pendingReviews.pendingAsProvider.length > 0 && (
              <div>
                <h3 className="font-medium text-amber-700 mb-2">
                  Skills You Provided
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingReviews.pendingAsProvider.map((request) => (
                    <div key={request._id} className="bg-white p-3 rounded border border-amber-100 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{request.skillId?.title}</p>
                        <p className="text-sm text-gray-600">Requester: {request.requesterId?.name}</p>
                      </div>
                      <button
                        onClick={() => handleOpenReviewModal(request)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded flex items-center"
                      >
                        <StarIcon className="h-4 w-4 mr-1" />
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading spinner */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Requests you've sent */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Requests You have Sent</h2>
              {sentRequests.length === 0 ? (
                <p className="bg-gray-50 p-8 text-center text-gray-500 rounded-lg">
                  You haven&apos;t sent any skill requests yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <div
                      key={request._id}
                      className="bg-white p-4 rounded-lg shadow-md border border-gray-100"
                    >
                      <div className="mb-3 flex justify-between items-start">
                        {/* Handle missing skill case */}
                        <h3 className="text-lg font-medium">
                          {request.skillId ? (
                            request.skillId.title
                          ) : (
                            <span className="text-red-500">
                              Skill No Longer Available
                            </span>
                          )}
                        </h3>
                        <StatusBadge status={request.status} />
                      </div>

                      <div className="mb-3 text-sm text-gray-600">
                        {request.skillId ? (
                          <>
                            <div className="mb-1">
                              <span className="font-medium">Description:</span>{" "}
                              {request.skillId.description}
                            </div>
                            <div className="flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {request.skillId.location || "No location specified"}
                            </div>
                          </>
                        ) : (
                          <p>This skill has been deleted by the provider.</p>
                        )}
                      </div>

                      <p className="my-3 text-gray-700">{request.message}</p>

                      <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                        <span>
                          Requested on {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMessage(
                              request.providerId._id, 
                              request._id, 
                              request.skillId.title,
                              request.status
                            )}
                            className="flex items-center text-blue-500 hover:text-blue-700"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                            Message Provider
                          </button>
                          
                          {request.status === "accepted" && (
                            <button
                              onClick={() => handleComplete(request._id)}
                              disabled={actionLoading}
                              className="flex items-center text-green-500 hover:text-green-700"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Mark Completed
                            </button>
                          )}
                          
                          {needsReviewFromUser(request) && (
                            <button
                              onClick={() => handleOpenReviewModal(request)}
                              className="flex items-center text-yellow-500 hover:text-yellow-700"
                            >
                              <StarIcon className="h-4 w-4 mr-1" />
                              Leave Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Requests you've received */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Requests You have Received</h2>
              {receivedRequests.length === 0 ? (
                <p className="bg-gray-50 p-8 text-center text-gray-500 rounded-lg">
                  You haven&apos;t received any skill requests yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {receivedRequests.map((request) => (
                    <div key={request._id} className="bg-white p-5 rounded-lg shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">
                            {request.skillId?.title || "Unnamed Skill"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            From: {request.requesterId?.name || "Unknown User"}
                          </p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>

                      <p className="my-3 text-gray-700">{request.message}</p>

                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Received on {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMessage(
                              request.requesterId._id, 
                              request._id, 
                              request.skillId.title,
                              request.status
                            )}
                            className="flex items-center text-blue-500 hover:text-blue-700"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                            Message Requester
                          </button>
                          
                          {/* Show accept/reject only if pending */}
                          {request.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespond(request._id, "accepted")}
                                disabled={actionLoading}
                                className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 flex items-center"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRespond(request._id, "rejected")}
                                disabled={actionLoading}
                                className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 flex items-center"
                              >
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Decline
                              </button>
                            </div>
                          )}
                          
                          {needsReviewFromUser(request) && (
                            <button
                              onClick={() => handleOpenReviewModal(request)}
                              className="flex items-center text-yellow-500 hover:text-yellow-700"
                            >
                              <StarIcon className="h-4 w-4 mr-1" />
                              Leave Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Review Modal */}
        {showReviewModal && currentRequest && (
          <SkillReviewModal
            request={currentRequest}
            reviewData={reviewData}
            setReviewData={setReviewData}
            onClose={() => {
              setShowReviewModal(false);
              setCurrentRequest(null);
            }}
            onSubmit={handleSubmitReview}
            loading={submittingReview}
            currentUserId={userData?._id}
          />
        )}
      </div>
    </MainLayout>
  );
}

// Helper component for status badges (unchanged)
function StatusBadge({ status }) {
  const getStatusStyles = () => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "accepted":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-4 w-4 mr-1" />;
      case "accepted":
        return <CheckCircleIcon className="h-4 w-4 mr-1" />;
      case "rejected":
        return <XCircleIcon className="h-4 w-4 mr-1" />;
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <span className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}>
      {getStatusIcon()}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired
};
