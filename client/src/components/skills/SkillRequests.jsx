import { useState, useEffect, useContext } from 'react';
import API from '../../services/api';
import { CheckCircleIcon, XCircleIcon, StarIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import SkillReviewModal from './SkillReviewModal'; 
import { AuthContext } from '../../context/AuthContext';

const SkillRequests = ({ onRequestProcessed }) => {
  const { userData } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pendingReviews, setPendingReviews] = useState({ pendingAsRequester: [], pendingAsProvider: [] });

  useEffect(() => {
    fetchRequests();
    fetchPendingReviews();
  }, []);

  // Implementation of fetchRequests function (your existing code)
  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log("SkillRequests component: Fetching pending requests...");
      const response = await API.get('/skillrequests/pending');
      console.log("SkillRequests component: Got response:", response.data);
      setRequests(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching skill requests:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      setError('Failed to load skill requests. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending reviews
  const fetchPendingReviews = async () => {
    try {
      const response = await API.get('/skillreviews/pending');
      console.log("Pending reviews:", response.data);
      setPendingReviews(response.data || { pendingAsRequester: [], pendingAsProvider: [] });
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
      toast.error("Failed to fetch pending reviews");
    }
  };

  // Handle accepting or declining a request
  const handleAction = async (requestId, action) => {
    try {
      setLoading(true);
      console.log(`Processing ${action} for request ${requestId}`);
      
      const response = await API.put(`/skillrequests/${requestId}/respond`, { 
        status: action === 'approve' ? 'accepted' : 'rejected' 
      });
      
      console.log("Response from server:", response.data);
      
      // Update local state
      setRequests(prevRequests => prevRequests.filter(req => req._id !== requestId));
      
      // Notify parent component
      if (onRequestProcessed) {
        onRequestProcessed();
      }
      
      // Show success message
      toast.success(`Request ${action === 'approve' ? 'approved' : 'declined'} successfully`);
      
      setError(null);
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      const errorMessage = error.response?.data?.message || `Failed to ${action} request`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Open the review modal for a request
  const handleOpenReviewModal = (request) => {
    setCurrentRequest(request);
    setReviewData({ rating: 5, comment: "" });
    setShowReviewModal(true);
  };

  // Handle submitting a review
  const handleSubmitReview = async (isProvider) => {
    if (submittingReview || !currentRequest) return;
    
    setSubmittingReview(true);
    try {
      console.log("Submitting review as provider:", isProvider);
      
      const response = await API.post("/skillreviews", {
        requestId: currentRequest._id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        isProvider: isProvider
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
      
      // Match error handling with resource review system
      if (error.response?.status === 429) {
        toast.error("You're submitting reviews too quickly. Please wait a moment.");
      } else {
        toast.error(error.response?.data?.message || "Failed to submit review");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading && requests.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 p-3">Loading requests...</p>;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-100 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={fetchRequests} 
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Calculate total pending reviews
  const hasPendingReviews = pendingReviews.pendingAsRequester?.length > 0 || pendingReviews.pendingAsProvider?.length > 0;

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {/* Display pending reviews notification */}
      {hasPendingReviews && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 mb-4">
          <div className="flex items-start">
            <StarIcon className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-400">Pending Reviews</h3>
              <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                <p>You have pending reviews to complete:</p>
                <ul className="mt-2 text-sm space-y-1">
                  {pendingReviews.pendingAsRequester?.length > 0 && (
                    <li>• {pendingReviews.pendingAsRequester.length} skills you received</li>
                  )}
                  {pendingReviews.pendingAsProvider?.length > 0 && (
                    <li>• {pendingReviews.pendingAsProvider.length} skills you provided</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 flex justify-end">
        <button
          onClick={fetchRequests}
          className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200"
          title="Refresh requests"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>
      
      {requests.length === 0 ? (
        <div className="p-3 text-center text-gray-500 dark:text-gray-400">
          No pending requests at this time
        </div>
      ) : (
        requests.map((request) => (
          <div key={request._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">{request.skillId?.title || "Unknown Skill"}</h3>
                <div className="flex items-center mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Requested by: <span className="font-medium">{request.requesterId?.name || "Unknown"}</span>
                  </p>
                  {request.requesterId?.trustScore && (
                    <div className="ml-2 flex items-center text-yellow-500">
                      <StarIcon className="h-4 w-4" />
                      <span className="text-xs ml-1">
                        {request.requesterId.trustScore.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAction(request._id, 'approve')}
                  disabled={loading}
                  className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/50"
                  title="Approve"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleAction(request._id, 'decline')}
                  disabled={loading}
                  className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50"
                  title="Decline"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Display pending reviews that need action */}
      {pendingReviews.pendingAsRequester?.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium text-gray-800 mb-3">Skills You Received - Pending Reviews</h3>
          <div className="space-y-3">
            {pendingReviews.pendingAsRequester.map(request => (
              <div key={request._id} className="p-3 border border-amber-100 rounded-lg bg-amber-50">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{request.skillId?.title || "Unknown Skill"}</p>
                    <p className="text-sm text-gray-600">Provider: {request.providerId?.name || "Unknown"}</p>
                  </div>
                  <button
                    onClick={() => handleOpenReviewModal(request)}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center"
                  >
                    <StarIcon className="h-4 w-4 mr-1" />
                    Leave Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingReviews.pendingAsProvider?.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium text-gray-800 mb-3">Skills You Provided - Pending Reviews</h3>
          <div className="space-y-3">
            {pendingReviews.pendingAsProvider.map(request => (
              <div key={request._id} className="p-3 border border-purple-100 rounded-lg bg-purple-50">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{request.skillId?.title || "Unknown Skill"}</p>
                    <p className="text-sm text-gray-600">Learner: {request.requesterId?.name || "Unknown"}</p>
                  </div>
                  <button
                    onClick={() => handleOpenReviewModal(request)}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center"
                  >
                    <StarIcon className="h-4 w-4 mr-1" />
                    Leave Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render the review modal when needed */}
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
  );
};

SkillRequests.propTypes = {
  onRequestProcessed: PropTypes.func
};

export default SkillRequests;