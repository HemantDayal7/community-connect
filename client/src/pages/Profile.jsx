import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import UserReviews from "../components/reviews/UserReviews";
import API from '../services/api';
import { PencilIcon, CameraIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

export default function Profile() {
  const { userData, refreshAuthStatus } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);
  
  // Update form data when profile data changes
  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        bio: profileData.bio || ''
      });
    }
  }, [profileData]);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/auth/me');
        setProfileData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageError(null);
    
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Please select a valid image (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size should be less than 5MB');
      return;
    }
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (imageError) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Create form data for multipart/form-data upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('bio', formData.bio);
      
      if (imageFile) {
        formDataToSend.append('profileImage', imageFile);
      }
      
      const { data } = await API.put('/users/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProfileData(data);
      setEditing(false);
      setImageFile(null);
      setImagePreview(null);
      
      // Refresh auth context to update the header and sidebar
      refreshAuthStatus();
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !profileData) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#69C143]"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 p-4 rounded-lg text-red-600 border border-red-200">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  // Use profileData or fall back to userData from context
  const user = profileData || userData;
  
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700 border border-yellow-200">
          <h2 className="text-lg font-semibold mb-2">Profile Unavailable</h2>
          <p>User data not available. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      {/* User details */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Edit Profile</h2>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setImageFile(null);
                  setImagePreview(null);
                  setImageError(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile preview" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                ) : user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl font-bold text-gray-600 dark:text-gray-300">
                    {user.name?.[0] || "?"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-md hover:bg-blue-600 transition-colors"
                >
                  <CameraIcon className="h-5 w-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              {imageError && (
                <p className="text-red-500 text-sm mt-2">{imageError}</p>
              )}
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Recommended: Square image, max 5MB
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
                className="w-full border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell the community about yourself..."
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || imageError}
                className={`${
                  loading || imageError 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-[#69C143] hover:bg-[#5aad3a]"
                } text-white px-4 py-2 rounded-md transition-colors`}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Personal Information</h2>
              <button
                onClick={() => setEditing(true)}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex-shrink-0">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl font-bold text-gray-600 dark:text-gray-300">
                    {user.name?.[0] || "?"}
                  </div>
                )}
              </div>
              
              <div className="flex-grow space-y-3 dark:text-white">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                {user.bio && <p><strong>Bio:</strong> {user.bio}</p>}
                {user.trustScore && (
                  <p>
                    <strong>Trust Score:</strong> {user.trustScore.toFixed(1)} 
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({user.totalReviews || 0} reviews)
                    </span>
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Recent Activity Section */}
      <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Recent Activity</h2>
        <RecentUserActivity userId={user._id} />
      </div>
      
      {/* Reviews section */}
      <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Reviews</h2>
        <UserReviews userId={user._id} />
      </div>
    </div>
  );
}

// Recent user activity component
function RecentUserActivity({ userId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define fetchActivity outside useEffect so it can be reused
  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API with explicit API URL
      try {
        console.log(`Fetching activity for user ID: ${userId}`);
        const response = await API.get(`/users/${userId}/activity`);
        console.log('Activity API response:', response);
        
        if (response.data && response.data.success && response.data.activities) {
          setActivities(response.data.activities);
          return;
        } else {
          console.warn('Invalid response format from activity API:', response.data);
          throw new Error('Invalid response format');
        }
      } catch (apiError) {
        console.warn('API error details:', apiError.response?.data || apiError.message);
        
        // Check if this is a 404 (endpoint not found) error
        if (apiError.response?.status === 404) {
          console.warn('Activity endpoint not found (404), using fallback data');
        } else {
          console.warn('Error fetching activity, using fallback data:', apiError);
        }
        
        // Continue to fallback if API fails
      }
      
      // Fallback: Generate mock data if API doesn't work
      setError("Couldn't load activity data. Please try again.");
      setActivities([]);
    } catch (err) {
      console.error('Error in activity component:', err);
      setError('Could not load activity data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Call the fetch function when the component mounts
  useEffect(() => {
    if (userId) {
      fetchActivity();
    }
  }, [userId, fetchActivity]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#69C143]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
        <button 
          onClick={fetchActivity}
          className="text-sm bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
        <div className="flex justify-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-2">No recent activity to display</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Your activities will appear here as you:
        </p>
        <ul className="text-sm text-gray-400 dark:text-gray-500 mt-2 space-y-1">
          <li>• Share resources with the community</li>
          <li>• Offer or request skills</li>
          <li>• Create or join community events</li>
          <li>• Ask for or offer help to neighbors</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start border-b border-gray-100 dark:border-gray-700 pb-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center text-gray-600 dark:text-gray-300 mr-3">
            {activity.icon || "📝"}
          </div>
          <div className="flex-1">
            <p className="text-sm dark:text-white">{activity.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

RecentUserActivity.propTypes = {
  userId: PropTypes.string.isRequired
};
