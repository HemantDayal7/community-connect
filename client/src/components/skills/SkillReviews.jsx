import { useState, useEffect } from "react";
import API from "../../services/api";
import { StarIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";
import { XCircleIcon } from "@heroicons/react/24/outline";
import Spinner from '../ui/Spinner';

// Date formatter function
const formatDate = (dateString) => {
  if (!dateString) return "No date";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Date error";
  }
};

// Component to display skill reviews
const SkillReviews = ({ skillId, providerId, showTitle = true, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        // Initialize query params based on what's provided
        let endpoint = "/skillreviews";
        let params = new URLSearchParams();
        
        if (skillId) {
          params.append("skillId", skillId);
        }
        
        if (providerId) {
          params.append("providerId", providerId);
        }
        
        const queryString = params.toString();
        const { data } = await API.get(`${endpoint}?${queryString}`);
        
        // Set the reviews
        setReviews(data.reviews || []);
        
        // Calculate average rating
        if (data.reviews && data.reviews.length > 0) {
          const totalRating = data.reviews.reduce((acc, review) => acc + review.rating, 0);
          setAverageRating((totalRating / data.reviews.length).toFixed(1));
        } else {
          setAverageRating(0);
        }
        
        setError(null);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    // Only fetch if we have at least one ID to filter by
    if (skillId || providerId) {
      fetchReviews();
    } else {
      setLoading(false);
    }
  }, [skillId, providerId]);

  if (loading) {
    return <div className="text-center py-4">Loading reviews...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-2">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {showTitle && (
          <div>
            <h3 className="font-semibold text-lg mb-1">Reviews</h3>
            <div className="flex items-center">
              <div className="flex mr-2">
                {[...Array(5)].map((_, i) => (
                  <StarIcon 
                    key={i} 
                    className={`h-5 w-5 ${
                      i < Math.round(averageRating) ? 'text-yellow-500' : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <span className="font-medium">{averageRating}</span>
              <span className="text-gray-500 ml-1">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          </div>
        )}
        
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner size="md" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No reviews yet. Be the first to review this skill!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {reviews.map((review) => {
            if (!review || !review._id) return null;
            
            return (
              <div key={review._id} className="bg-gray-50 p-3 rounded-md border">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium">{review.reviewerId?.name || "Anonymous"}</span>
                      <div className="ml-2 flex">
                        {/* Rating stars */}
                        {[...Array(5)].map((_, i) => (
                          <StarIcon 
                            key={i} 
                            className={`h-4 w-4 ${
                              i < (review.rating || 0) ? 'text-yellow-500' : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  
                  {review.skillId && (
                    <p className="text-xs text-gray-500">
                      Skill: {review.skillId.title || "Unknown skill"}
                    </p>
                  )}
                </div>
                
                {review.comment && (
                  <p className="mt-2 text-gray-700">{review.comment}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

SkillReviews.propTypes = {
  skillId: PropTypes.string,
  providerId: PropTypes.string,
  showTitle: PropTypes.bool,
  onClose: PropTypes.func
};

export default SkillReviews;