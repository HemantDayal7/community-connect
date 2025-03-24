import { useState, useEffect, useContext, useMemo } from "react";
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
  MapPinIcon,
  ExclamationCircleIcon
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

  // Update the handleComplete function (around line 112-140)
const handleComplete = async (requestId) => {
  try {
    setActionLoading(true);
    
    // Show confirmation with detailed explanation
    if (!window.confirm(
      "Are you sure you want to mark this skill exchange as completed?\n\n" +
      "This will:\n" +
      "• Make the skill available for other community members\n" +
      "• Allow both you and the provider to leave reviews\n" +
      "• Move this from active bookings to your history"
    )) {
      setActionLoading(false);
      return;
    }
    
    console.log("Completing skill request:", requestId);
    const response = await API.put(`/skillrequests/${requestId}/complete`);
    console.log("Completion response:", response.data);

    if (response.data?.success) {
      toast.success("🎉 Skill exchange completed successfully! You can now leave a review.", {
        position: "top-center",
        autoClose: 5000
      });
      
      // Update local state
      setRequests(prevRequests =>
        prevRequests.map(req => (req._id === requestId 
          ? { ...req, status: "completed" } 
          : req
        ))
      );
      
      // Refresh pending reviews to show new review opportunities
      await fetchPendingReviews();
      
      // Open review modal after a slight delay
      setTimeout(() => {
        const completedRequest = requests.find(req => req._id === requestId);
        if (completedRequest) {
          handleOpenReviewModal({...completedRequest, status: "completed"});
        }
      }, 800);
    } else {
      console.warn("Unexpected response format:", response);
      toast.info("Request status updated. Please refresh to see changes.");
      fetchRequests();
    }
  } catch (err) {
    console.error("Error completing request:", err);
    toast.error(err.response?.data?.message || "Failed to mark request as completed");
  } finally {
    setActionLoading(false);
  }
};

// Add near the top of the component function around line 50-60

// Check URL for automatic review opening
useEffect(() => {
  const query = new URLSearchParams(window.location.search);
  const openReview = query.get('openReview');
  const requestId = query.get('requestId');
  
  if (openReview === 'true' && requestId && requests.length > 0) {
    const requestToReview = requests.find(req => req._id === requestId);
    if (requestToReview) {
      handleOpenReviewModal(requestToReview);
      // Clear URL parameters after handling them
      window.history.replaceState({}, document.title, '/skill-requests');
    }
  }
}, [requests]);

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
    if (!request.skillId || request.skillId === null || request.skillId._id === "deleted") {
      return false;
    }
    
    if (request.status !== "completed") return false;
    
    const isRequester = request.requesterId?._id === userData?._id;
    const isProvider = request.providerId?._id === userData?._id;
    
    if (isRequester && !request.requesterReviewed) return true;
    if (isProvider && !request.providerReviewed) return true;
    
    return false;
  };

  // Separate requests by type and status - keeping only ONE set of these variables
  const acceptedSentRequests = useMemo(() => 
    requests.filter(req => 
      req.requesterId?._id === userData?._id && 
      req.status === "accepted"
    ), 
    [requests, userData]
  );

  // Add a debug line to help troubleshoot (you can remove later)
  useEffect(() => {
    console.log("Accepted sent requests:", acceptedSentRequests);
  }, [acceptedSentRequests]);

  const acceptedReceivedRequests = useMemo(() => 
    requests.filter(req => 
      req.providerId?._id === userData?._id && 
      req.status === "accepted"
    ), 
    [requests, userData]
  );

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

        {/* Add this notification banner at the top of your component, after the HeaderTabs section */}
        {acceptedSentRequests.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Do not forget:</span> Once you have received the skill service, please mark it as Completed so the provider can help others.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add this near the top of the page content (around line 280) */}
        {acceptedSentRequests.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-4 rounded-r-md shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-bold text-yellow-800">Action Required: Skill Service Received</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="font-medium">
                    You have {acceptedSentRequests.length} active skill {acceptedSentRequests.length === 1 ? 'service' : 'services'} that you can mark as completed.
                  </p>
                  <p className="mt-1">
                    After receiving the service, please mark it as completed so the provider can help other community members. 
                    This will make the skill available for other users.
                  </p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      document.getElementById('active-bookings-section').scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    View Active Services
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Banner with more prominent design */}
        {acceptedSentRequests.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-4 rounded-r-md shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-bold text-yellow-800">Action Required: Skill Service Received</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="font-medium">
                    You have {acceptedSentRequests.length} active skill {acceptedSentRequests.length === 1 ? 'service' : 'services'} that you can mark as completed.
                  </p>
                  <p className="mt-1">
                    After receiving the service, please mark it as completed so the provider can help other community members. 
                    This will also make the skill available for other users.
                  </p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      document.getElementById('active-bookings-section').scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    View Active Services
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Alerts Banner */}
        {(acceptedSentRequests.length > 0 || 
          (pendingReviews.pendingAsRequester && pendingReviews.pendingAsRequester.length > 0) || 
          (pendingReviews.pendingAsProvider && pendingReviews.pendingAsProvider.length > 0)) && (
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-800 mb-2">Action Items:</h3>
            <ul className="space-y-1">
              {acceptedSentRequests.length > 0 && (
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    You have <span className="font-medium text-indigo-700">{acceptedSentRequests.length}</span> active skill {acceptedSentRequests.length === 1 ? 'booking' : 'bookings'} - mark as completed when done.
                  </span>
                </li>
              )}
              {pendingReviews.pendingAsRequester && pendingReviews.pendingAsRequester.length > 0 && (
                <li className="flex items-start">
                  <StarIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    You have <span className="font-medium text-indigo-700">{pendingReviews.pendingAsRequester.length}</span> pending {pendingReviews.pendingAsRequester.length === 1 ? 'review' : 'reviews'} for skills you received.
                  </span>
                </li>
              )}
              {pendingReviews.pendingAsProvider && pendingReviews.pendingAsProvider.length > 0 && (
                <li className="flex items-start">
                  <StarIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    You have <span className="font-medium text-indigo-700">{pendingReviews.pendingAsProvider.length}</span> pending {pendingReviews.pendingAsProvider.length === 1 ? 'review' : 'reviews'} for skills you provided.
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Pending Reviews Section - Enhanced styling */}
        {(pendingReviews.pendingAsRequester.length > 0 || pendingReviews.pendingAsProvider.length > 0) && (
          <div id="pending-reviews-section" className="mb-8 bg-gradient-to-r from-amber-50 to-yellow-50 p-5 rounded-lg border border-amber-200 shadow-sm">
            <h2 className="text-lg font-bold mb-4 text-amber-800 flex items-center">
              <StarIcon className="h-6 w-6 mr-2 text-amber-500" />
              Pending Reviews
            </h2>
            
            {pendingReviews.pendingAsRequester.length > 0 && (
              <div className="mb-5">
                <h3 className="font-medium text-amber-700 mb-3 border-b border-amber-200 pb-2">
                  Rate Skills You Received
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingReviews.pendingAsRequester.map((request) => (
                    <div key={request._id} className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{request.skillId?.title}</p>
                          <p className="text-sm text-gray-600">Provider: {request.providerId?.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Completed on {new Date(request.completedAt || request.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenReviewModal(request)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md flex items-center shadow-sm"
                        >
                          <StarIcon className="h-4 w-4 mr-1" />
                          Rate & Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {pendingReviews.pendingAsProvider.length > 0 && (
              <div>
                <h3 className="font-medium text-amber-700 mb-3 border-b border-amber-200 pb-2">
                  Rate Skills You Provided
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingReviews.pendingAsProvider.map((request) => (
                    <div key={request._id} className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{request.skillId?.title}</p>
                          <p className="text-sm text-gray-600">Learner: {request.requesterId?.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Completed on {new Date(request.completedAt || request.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenReviewModal(request)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md flex items-center shadow-sm"
                        >
                          <StarIcon className="h-4 w-4 mr-1" />
                          Rate & Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Bookings Section - With anchor for smooth scrolling */}
        <div id="active-bookings-section" className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-indigo-700">Active Bookings</h2>

          <div>
            {/* As Learner - Prominently display mark as completed */}
            {acceptedSentRequests.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3 text-indigo-600">Skills You are Learning</h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {acceptedSentRequests.map((request) => (
                    <div
                      key={request._id}
                      className="relative overflow-hidden rounded-lg border-2 border-green-300 shadow-md"
                    >
                      {/* Attention-grabbing banner */}
                      <div className="bg-green-600 text-white text-sm py-2 px-3 text-center font-medium">
                        Ready to mark this skill service as completed?
                      </div>
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-lg">{request.skillId?.title || "Unnamed Skill"}</h4>
                            <p className="text-sm text-gray-600">
                              Provider: {request.providerId?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Accepted on {new Date(request.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusBadge status={request.status} />
                        </div>
                        
                        {/* Make completion button SUPER prominent */}
                        <div className="mt-4 bg-green-50 p-4 rounded-lg border-2 border-dashed border-green-300">
                          <div className="text-center">
                            <p className="mb-3 text-sm text-green-800 font-medium">
                              After receiving this skill service, mark it as completed to make it available for others
                            </p>
                            <button
                              onClick={() => handleComplete(request._id)}
                              disabled={actionLoading}
                              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium shadow-sm transition-colors flex items-center justify-center"
                            >
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                              MARK AS COMPLETED
                            </button>
                            
                            <div className="mt-3">
                              <button
                                onClick={() => handleMessage(
                                  request.providerId._id, 
                                  request._id, 
                                  request.skillId?.title,
                                  request.status
                                )}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
                              >
                                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                                Message Provider
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* As Provider */}
            {acceptedReceivedRequests.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-3 text-indigo-600">Skills You are Teaching</h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {acceptedReceivedRequests.map((request) => (
                    <div
                      key={request._id}
                      className="bg-purple-50 p-4 rounded-lg border border-purple-100 relative"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{request.skillId?.title || "Unnamed Skill"}</h4>
                          <p className="text-sm text-gray-600">
                            Learner: {request.requesterId?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Accepted on {new Date(request.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                      <button
                        onClick={() => handleMessage(
                          request.requesterId._id, 
                          request._id, 
                          request.skillId?.title,
                          request.status
                        )}
                        className="mt-3 text-sm flex items-center bg-white text-blue-600 px-3 py-1 rounded-md hover:bg-blue-50 border border-blue-100"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                        Message
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

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
                              request.skillId?.title || "Unknown Skill",
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
                              className="flex items-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium shadow-sm transition-colors"
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
                      {/* For sent requests - requester can mark completed */}
                      {request.status === "accepted" && (
                        <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-100">
                          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="text-sm text-green-700">
                              <span className="font-medium">Ready to complete?</span> Once you have received this skill service, mark it as completed.
                            </div>
                            <button
                              onClick={() => handleComplete(request._id)}
                              disabled={actionLoading}
                              className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium shadow-sm transition-colors w-full sm:w-auto justify-center sm:justify-start"
                            >
                              <CheckCircleIcon className="h-5 w-5 mr-1" />
                              Mark as Completed
                            </button>
                          </div>
                        </div>
                      )}
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
                              request.skillId?.title || "Unknown Skill",
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

// Status badge component for better visual cues
function StatusBadge({ status }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          Pending
        </span>
      );
    case "accepted":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Active
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Declined
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Completed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired
};
