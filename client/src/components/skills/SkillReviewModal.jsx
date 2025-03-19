import { useState } from "react";
import PropTypes from "prop-types";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import { XCircleIcon } from "@heroicons/react/24/outline"; // Used for modal close button

const SkillReviewModal = ({
  request,
  reviewData,
  setReviewData,
  onClose,
  onSubmit,
  loading,
  currentUserId
}) => {
  const [localComment, setLocalComment] = useState(reviewData?.comment || "");

  if (!request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setReviewData(prev => ({ ...prev, comment: localComment }));
    onSubmit(e);
  };

  // Determine if user is the requester or provider
  const isRequester = request.requesterId && 
    request.requesterId._id === currentUserId;

  const personName = isRequester
    ? request.providerId?.name || "the provider"
    : request.requesterId?.name || "the requester";

  const skillTitle = request.skillId?.title || "this skill";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <XCircleIcon className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold mb-4">Leave a Review</h2>
        <p className="mb-4 text-gray-600">
          {isRequester
            ? `How was your experience with ${personName} providing ${skillTitle}?`
            : `How was your experience with ${personName} requesting ${skillTitle}?`}
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
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Share your experience..."
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
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
                  : "bg-blue-500 hover:bg-blue-600"
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

SkillReviewModal.propTypes = {
  request: PropTypes.object,
  reviewData: PropTypes.object.isRequired,
  setReviewData: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  currentUserId: PropTypes.string.isRequired
};

export default SkillReviewModal;