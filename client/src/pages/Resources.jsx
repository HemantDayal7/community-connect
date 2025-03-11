import { useState, useEffect, useContext } from "react";
import API from "../services/api";
import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { AuthContext } from "../context/AuthContext";

export default function Resources() {
  // Predefined category options
  const categoryOptions = [
    "Electronics",
    "Tools",
    "Books",
    "Furniture",
    "Household",  // Added Household category
    "Clothing",
    "Kitchen",
    "Garden",
    "Sports",
    "Toys",
    "Other",
  ];
  
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    availability: "available", 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get current user from context
  const { userData } = useContext(AuthContext);
  const currentUserId = userData?._id;

  // Fetch resources on mount
  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/resources");
      setResources(data);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      setError("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!newResource.title.trim() || !newResource.description.trim()) return;
    
    try {
      setLoading(true);
      const { data } = await API.post("/resources", newResource);
      setResources([...resources, data.resource]);
      // Reset form fields
      setNewResource({
        title: "",
        description: "",
        category: "",
        location: "",
        availability: "available",
      });
      setError(null);
    } catch (error) {
      console.error("Error adding resource:", error);
      setError("Error adding resource: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (id) => {
    try {
      setLoading(true);
      await API.delete(`/resources/${id}`);
      setResources(resources.filter((resource) => resource._id !== id));
      setError(null);
    } catch (error) {
      console.error("Error deleting resource:", error);
      setError("Error deleting resource: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      setLoading(true);
      
      // No need to send availability in the request, the server will toggle it
      const { data } = await API.put(`/resources/${id}`);
      
      // Update resource in state with the fully populated response
      setResources(resources.map(res => res._id === id ? data : res));
      setError(null);
    } catch (error) {
      console.error("Error updating resource status:", error);
      setError("Error updating resource: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Resource Sharing</h1>
      <p className="mb-6 text-gray-600">Share resources with your community or borrow what you need</p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Add Resource Form */}
      <div className="bg-gray-50 p-4 rounded-lg mb-8">
        <h2 className="text-lg font-medium mb-3">Share a Resource</h2>
        <form onSubmit={handleAddResource} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Resource Title*"
              value={newResource.title}
              onChange={(e) =>
                setNewResource({ ...newResource, title: e.target.value })
              }
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            
            {/* Category Dropdown - Replacing the text input */}
            <select
              value={newResource.category}
              onChange={(e) =>
                setNewResource({ ...newResource, category: e.target.value })
              }
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              required
            >
              <option value="">Select Category*</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Description*"
            value={newResource.description}
            onChange={(e) =>
              setNewResource({ ...newResource, description: e.target.value })
            }
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            rows="2"
          ></textarea>
          <input
            type="text"
            placeholder="Location*"
            value={newResource.location}
            onChange={(e) =>
              setNewResource({ ...newResource, location: e.target.value })
            }
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <button
            type="submit"
            className="bg-[#69C143] hover:bg-[#5DAF3B] text-white px-4 py-2 rounded flex items-center transition"
            disabled={loading}
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" /> 
            {loading ? 'Adding...' : 'Add Resource'}
          </button>
        </form>
      </div>

      {/* Resource List */}
      <div>
        <h2 className="text-lg font-medium mb-3">Available Resources</h2>
        
        {loading && resources.length === 0 ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#69C143]"></div>
          </div>
        ) : resources.length === 0 ? (
          <p className="text-gray-500 p-4 text-center border border-dashed rounded-md">
            No resources available yet. Be the first to share!
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => {
              // Check if current user is the owner or borrower
              const isOwner = resource.ownerId?._id === currentUserId;
              const isBorrower = resource.borrowedBy?._id === currentUserId;
              
              // Extract names for display
              const ownerName = resource.ownerId?.name || "Community Member";
              const borrowerName = resource.borrowedBy?.name;
              
              return (
                <div
                  key={resource._id}
                  className={`p-4 rounded-md border hover:shadow-md transition ${
                    resource.availability === "available" ? "bg-gray-50" : "bg-amber-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{resource.title}</h3>
                    <span 
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        resource.availability === "available" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {resource.availability === "available" ? "Available" : "Borrowed"}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2 mb-3">{resource.description}</p>
                  
                  <div className="text-xs text-gray-500 mt-auto space-y-1">
                    {resource.category && (
                      <p><span className="font-medium">Category:</span> {resource.category}</p>
                    )}
                    {resource.location && (
                      <p><span className="font-medium">Location:</span> {resource.location}</p>
                    )}
                    <p>
                      <span className="font-medium">Owner:</span> {ownerName}
                      {isOwner && <span className="ml-1 text-blue-500">(You)</span>}
                    </p>
                    
                    {/* Show borrower information if borrowed */}
                    {resource.borrowedBy && (
                      <p>
                        <span className="font-medium text-amber-700">Borrowed by:</span>{" "}
                        {borrowerName}
                        {isBorrower && <span className="ml-1 text-blue-500">(You)</span>}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-4 pt-3 border-t">
                    {/* BUTTON LOGIC */}
                    <div>
                      {/* Case 1: User is not the owner and resource is available */}
                      {!isOwner && resource.availability === "available" && (
                        <button
                          onClick={() => handleToggleStatus(resource._id)}
                          className="px-3 py-1 rounded text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white"
                          disabled={loading}
                        >
                          Borrow
                        </button>
                      )}
                      
                      {/* Case 2: User is the borrower */}
                      {isBorrower && resource.availability === "borrowed" && (
                        <button
                          onClick={() => handleToggleStatus(resource._id)}
                          className="px-3 py-1 rounded text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white"
                          disabled={loading}
                        >
                          Return
                        </button>
                      )}
                      
                      {/* Case 3: User is the owner */}
                      {isOwner && (
                        <span className="text-xs text-gray-500 italic">Your resource</span>
                      )}
                      
                      {/* Case 4: User is neither owner nor borrower, and resource is borrowed */}
                      {!isOwner && !isBorrower && resource.availability === "borrowed" && (
                        <span className="text-xs text-amber-600 italic">Currently unavailable</span>
                      )}
                    </div>
                    
                    {/* Delete button - only for owner */}
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteResource(resource._id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={loading}
                        title="Delete resource"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
