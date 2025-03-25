import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import PropTypes from "prop-types";
import API from "../../services/api";
import Spinner from "../ui/Spinner";

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
        setError(err.response?.data?.message || "Error searching users");
      } finally {
        setLoading(false);
      }
    };

    // Use debounce to avoid making too many requests
    const debounceTimer = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Find Users
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10 w-full border dark:border-gray-600 rounded-md px-4 py-2 focus:ring-[#69C143] focus:border-[#69C143] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              autoFocus
            />
          </div>

          {loading && (
            <div className="flex justify-center my-4">
              <Spinner size="md" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}

          {searchTerm.length > 1 && !loading && searchResults.length === 0 && (
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400">No users found matching &quot;{searchTerm}&quot;</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try using a different name or email</p>
            </div>
          )}

          <ul className="max-h-60 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
            {searchResults.map(user => (
              <li key={user._id}>
                <button
                  onClick={() => onSelectUser(user)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md flex items-center transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3 text-gray-600 dark:text-gray-300">
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt={user.name.charAt(0)} 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <span className="font-medium">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
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