import { useState, useEffect } from "react";
import API from "../../services/api";
import { StarIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types"; // Add this import

// Simple date formatter function without using external libraries
const formatDate = (dateString) => {
  if (!dateString) return "No date";
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    
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

const UserReviews = ({ userId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!userId) {
        setError("No user ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const { data } = await API.get(`/reviews/user/${userId}`);
        setReviews(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

  if (loading) {
    return <div className="text-center py-4">Loading reviews...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-2">{error}</div>;
  }

  if (!reviews || reviews.length === 0) {
    return <p className="text-gray-500 italic">No reviews yet</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        // Safely check if review is valid
        if (!review || !review._id) {
          return null;
        }
        
        return (
          <div key={review._id} className="bg-gray-50 p-3 rounded-md border">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <span className="font-medium">{review.reviewerId?.name || "Anonymous"}</span>
                  <div className="ml-2 flex">
                    {/* Generate rating stars */}
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
              <p className="text-xs text-gray-500">
                Resource: {review.resourceId?.title || "Unknown resource"}
              </p>
            </div>
            {review.comment && (
              <p className="mt-2 text-gray-700">{review.comment}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

UserReviews.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UserReviews;