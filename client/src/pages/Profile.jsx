import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import UserReviews from "../components/reviews/UserReviews";
import API from '../services/api';

export default function Profile() {
  const { userData } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading profile...</div>;
  }
  
  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }
  
  // Use profileData or fall back to userData from context
  const user = profileData || userData;
  
  if (!user) {
    return <div className="container mx-auto p-4 text-red-500">User data not available</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">My Profile</h1>
      
      {/* User details */}
      <div className="mt-6 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        {user.trustScore && (
          <p>
            <strong>Trust Score:</strong> {user.trustScore.toFixed(1)} 
            ({user.totalReviews || 0} reviews)
          </p>
        )}
      </div>
      
      {/* Reviews section */}
      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>
        <UserReviews userId={user._id} />
      </div>
    </div>
  );
}
