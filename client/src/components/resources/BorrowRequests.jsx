import { useState, useEffect } from 'react';
import API from '../../services/api';
import PropTypes from 'prop-types';
import { StarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const BorrowRequests = ({ onRequestProcessed }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await API.get('/resources/borrow-requests');
      setRequests(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching borrow requests:', error);
      setError('Failed to load borrow requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    try {
      setLoading(true);
      await API.put(`/resources/borrow-request/${requestId}`, { action });
      
      // Update local state
      setRequests(prevRequests => prevRequests.filter(req => req._id !== requestId));
      
      // Notify parent component
      if (onRequestProcessed) {
        onRequestProcessed();
      }
      
      setError(null);
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      setError(`Failed to ${action} request`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && requests.length === 0) {
    return <div className="p-4 text-center">Loading borrow requests...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <h2 className="text-lg font-semibold text-blue-800">Pending Borrow Requests</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          <p>No pending borrow requests at this time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-blue-50 border-b border-blue-100">
        <h2 className="text-lg font-semibold text-blue-800">Pending Borrow Requests</h2>
      </div>
      <div className="divide-y">
        {requests.map((request) => (
          <div key={request._id} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{request.resourceId?.title || "Unnamed resource"}</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm text-gray-600">
                    Requested by: <span className="font-medium">{request.borrowerId?.name || "Unknown"}</span>
                  </p>
                  <div className="ml-2 flex items-center text-yellow-500">
                    <StarIcon className="h-4 w-4" />
                    <span className="text-xs ml-1">
                      {request.borrowerId?.trustScore?.toFixed(1) || "N/A"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAction(request._id, 'approve')}
                  disabled={loading}
                  className="p-2 bg-green-100 rounded-full text-green-600 hover:bg-green-200"
                  title="Approve"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleAction(request._id, 'decline')}
                  disabled={loading}
                  className="p-2 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
                  title="Decline"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

BorrowRequests.propTypes = {
  onRequestProcessed: PropTypes.func
};

export default BorrowRequests;