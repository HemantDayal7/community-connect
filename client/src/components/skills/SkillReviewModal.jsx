import { useState } from 'react';
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import PropTypes from 'prop-types';

const SkillReviewModal = ({ request, reviewData, setReviewData, onClose, onSubmit, loading, currentUserId }) => {
  // Determine if the current user is the provider or requester
  const isProvider = currentUserId === request.providerId?._id;
  const userBeingReviewed = isProvider ? request.requesterId?.name : request.providerId?.name;
  const [localComment, setLocalComment] = useState(reviewData?.comment || "");
  
  const handleRatingClick = (rating) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setReviewData(prev => ({ ...prev, comment: localComment }));
    onSubmit(isProvider);
  };

  const skillTitle = request.skillId?.title || "this skill";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            Leave a Review
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isProvider
              ? `How was your experience teaching ${userBeingReviewed || "this learner"} about ${skillTitle}?`
              : `How was your experience learning ${skillTitle} from ${userBeingReviewed || "this provider"}?`}
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-5">
            {/* Star Rating */}
            <div className="mb-4 text-center">
              <p className="text-gray-700 mb-2">Your rating:</p>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    {star <= reviewData.rating ? (
                      <StarIcon className="h-8 w-8 text-yellow-400" />
                    ) : (
                      <StarOutline className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {reviewData.rating} out of 5 stars
              </p>
            </div>
            
            {/* Comment */}
            <div className="mb-4">
              <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-1">
                Comments (optional):
              </label>
              <textarea
                id="review-comment"
                value={localComment}
                onChange={(e) => setLocalComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Share your experience..."
              ></textarea>
            </div>
          </div>
          
          <div className="px-5 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#69C143] hover:bg-[#5DAF3B] text-white rounded-md flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

SkillReviewModal.propTypes = {
  request: PropTypes.object.isRequired,
  reviewData: PropTypes.object.isRequired,
  setReviewData: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  currentUserId: PropTypes.string
};

export default SkillReviewModal;