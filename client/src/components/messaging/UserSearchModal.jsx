import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import API from "../../services/api";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function UserSearchModal({ onClose, onSelectUser }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Don't search if term is too short
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔍 Sending search request: ${searchTerm}`);
        
        // Add this to see the full URL being requested
        const searchUrl = `/users/search?search=${encodeURIComponent(searchTerm)}`;
        console.log(`🌐 Request URL: ${searchUrl}`);
        
        const response = await API.get(searchUrl);
        console.log("✅ Search response:", response.data);
        setSearchResults(response.data || []);
      } catch (err) {
        console.error("❌ Error searching users:", err);
        setError(err.response?.data?.message || "Failed to search users");
      } finally {
        setLoading(false);
      }
    };

    // Debounce search requests
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">Start a New Conversation</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10 w-full border rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {loading && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}

          {searchTerm.length > 1 && !loading && searchResults.length === 0 && (
            <p className="text-center text-gray-500 my-4">No users found</p>
          )}

          <ul className="max-h-60 overflow-y-auto">
            {searchResults.map(user => (
              <li key={user._id}>
                <button
                  onClick={() => onSelectUser(user)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt={user.name.charAt(0)} 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <span className="text-gray-600">{user.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

UserSearchModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelectUser: PropTypes.func.isRequired
};