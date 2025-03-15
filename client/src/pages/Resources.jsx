import { useState, useEffect, useContext, useCallback } from "react";
import {
  PlusCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ResourceCard from "../components/resources/ResourceCard";
import BorrowRequests from "../components/resources/BorrowRequests";
import PropTypes from "prop-types";

// ===================
// ReviewModal Component
// ===================
const ReviewModal = ({
  currentTransaction,
  reviewData,
  setReviewData,
  setShowReviewModal,
  setCurrentTransaction,
  handleReviewSubmit,
  loading,
  currentUserId,
}) => {
  const [localComment, setLocalComment] = useState(reviewData?.comment || "");

  if (!currentTransaction) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setReviewData((prev) => ({ ...prev, comment: localComment }));
    handleReviewSubmit(e);
  };

  const reviewingOwner =
    currentTransaction.ownerId &&
    currentTransaction.ownerId._id &&
    currentTransaction.borrowerId &&
    currentTransaction.borrowerId._id === currentUserId;

  const personName = reviewingOwner
    ? currentTransaction.ownerId?.name || "the owner"
    : currentTransaction.borrowerId?.name || "the borrower";

  const resourceTitle = currentTransaction.resourceId?.title || "this resource";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Leave a Review</h2>
        <p className="mb-4 text-gray-600">
          {reviewingOwner
            ? `How was your experience borrowing ${resourceTitle} from ${personName}?`
            : `How was your experience with ${personName} borrowing ${resourceTitle}?`}
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
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
              rows="3"
              placeholder="Share your experience..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowReviewModal(false);
                setCurrentTransaction(null);
              }}
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
                  : "bg-[#69C143] hover:bg-[#5DAF3B]"
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

ReviewModal.propTypes = {
  currentTransaction: PropTypes.object,
  reviewData: PropTypes.object.isRequired,
  setReviewData: PropTypes.func.isRequired,
  setShowReviewModal: PropTypes.func.isRequired,
  setCurrentTransaction: PropTypes.func.isRequired,
  handleReviewSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  currentUserId: PropTypes.string,
};

// ===================
// AddResourceModal Component
// ===================
const AddResourceModal = ({
  setShowAddModal,
  newResource,
  setNewResource,
  handleAddResource,
  loading,
  categoryOptions,
}) => {
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewResource((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Share a Resource</h2>
          <button
            onClick={() => setShowAddModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
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
            rows="3"
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Resource Image
            </label>
            <input type="file" onChange={handleImageChange} className="mt-1" />
            {imagePreview && (
              <div className="mt-2 relative">
                <img
                  src={imagePreview}
                  alt="Resource preview"
                  className="w-full h-32 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setNewResource((prev) => ({ ...prev, image: null }));
                  }}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#69C143] hover:bg-[#5DAF3B] text-white px-4 py-2 rounded flex items-center transition"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              {loading ? "Adding..." : "Add Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AddResourceModal.propTypes = {
  setShowAddModal: PropTypes.func.isRequired,
  newResource: PropTypes.object.isRequired,
  setNewResource: PropTypes.func.isRequired,
  handleAddResource: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  categoryOptions: PropTypes.array.isRequired,
};

// ===================
// Main Resources Page Component
// ===================
const Resources = () => {
  const categoryOptions = [
    "Electronics",
    "Tools",
    "Books",
    "Furniture",
    "Household",
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
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingReviews, setPendingReviews] = useState({
    pendingAsOwner: [],
    pendingAsBorrower: [],
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [myResources, setMyResources] = useState([]);

  const { userData } = useContext(AuthContext);
  const currentUserId = userData?._id;
  const navigate = useNavigate();

  // Fetch resources (memoized)
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching resources...");
      const response = await API.get("/resources");
      console.log("Resource data received:", response.data?.length || 0, "items");
      if (response.data && Array.isArray(response.data)) {
        setResources(response.data);
        setError(null);
        const myRes = response.data.filter(
          (r) =>
            r.ownerId?._id === userData?._id || r.ownerId === userData?._id
        );
        setMyResources(myRes);
      } else {
        console.error("Invalid resource data format:", response.data);
        setError("Received invalid resource data from server");
      }
    } catch (err) {
      console.error("Error fetching resources:", err);
      setError("Failed to load resources: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [userData]);

  // Fetch pending reviews (memoized)
  const fetchPendingReviews = useCallback(async () => {
    if (!currentUserId) return;
    try {
      console.log("Fetching pending reviews for user:", currentUserId);
      const { data } = await API.get("/reviews/pending");
      if (data && typeof data === "object") {
        console.log("Pending reviews received:", data);
        setPendingReviews({
          pendingAsOwner: Array.isArray(data.pendingAsOwner)
            ? data.pendingAsOwner
            : [],
          pendingAsBorrower: Array.isArray(data.pendingAsBorrower)
            ? data.pendingAsBorrower
            : [],
        });
        if (
          !showReviewModal &&
          ((data.pendingAsOwner && data.pendingAsOwner.length > 0) ||
            (data.pendingAsBorrower && data.pendingAsBorrower.length > 0))
        ) {
          const firstReview = data.pendingAsBorrower[0] || data.pendingAsOwner[0];
          if (firstReview) {
            console.log("Auto-showing review modal for:", firstReview);
            setCurrentTransaction(firstReview);
            setShowReviewModal(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
      setPendingReviews({ pendingAsOwner: [], pendingAsBorrower: [] });
    }
  }, [currentUserId, showReviewModal]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    fetchPendingReviews();
  }, [fetchPendingReviews]);

  useEffect(() => {
    if (currentUserId) {
      fetchPendingReviews();
    }
  }, [resources, fetchPendingReviews, currentUserId]);

  // Handler for adding a resource
  const handleAddResource = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newResource.title.trim() || !newResource.description.trim()) {
        setError("Title and description are required");
        return;
      }
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append("title", newResource.title.trim());
        formData.append("description", newResource.description.trim());
        formData.append("category", newResource.category);
        formData.append("location", newResource.location.trim());
        formData.append("availability", "available");
        if (newResource.image) {
          formData.append("image", newResource.image);
        }
        const response = await API.post("/resources", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response.data) {
          setResources((prev) => [...prev, response.data]);
        }
        setNewResource({
          title: "",
          description: "",
          category: "",
          location: "",
          availability: "available",
          image: null,
        });
        setShowAddModal(false);
        setError(null);
      } catch (error) {
        console.error("Error adding resource:", error);
        setError("Error adding resource: " + error.message);
      } finally {
        setLoading(false);
      }
    },
    [newResource, fetchResources]
  );

  // Handler for toggling resource status (borrow/return)
  const handleToggleStatus = useCallback(
    async (updatedResource) => {
      try {
        setLoading(true);
        if (!updatedResource || !updatedResource._id) {
          console.error("Invalid resource data received:", updatedResource);
          throw new Error("Invalid resource data");
        }
        setResources((prev) =>
          prev.map((r) =>
            r._id === updatedResource._id ? { ...r, ...updatedResource } : r
          )
        );
        const response = await API.get(`/resources/${updatedResource._id}`);
        const fullResource = response.data;
        setResources((prev) =>
          prev.map((r) =>
            r._id === updatedResource._id ? fullResource : r
          )
        );
        if (updatedResource.availability === "available") {
          await fetchPendingReviews();
        }
        setError(null);
      } catch (error) {
        console.error("Error updating resource:", error);
        setError(error.response?.data?.message || "Failed to update resource");
        fetchResources();
      } finally {
        setLoading(false);
      }
    },
    [fetchPendingReviews, fetchResources]
  );

  // Handler for review submission
  const handleSubmitReview = useCallback(
    async (e) => {
      e.preventDefault();
      if (submittingReview) return;
      setSubmittingReview(true);
      try {
        console.log("Submitting review:", {
          transactionId: currentTransaction?._id,
          rating: reviewData.rating,
          comment: reviewData.comment,
        });
        const response = await API.post("/reviews", {
          transactionId: currentTransaction?._id,
          rating: reviewData.rating,
          comment: reviewData.comment,
        });
        console.log("Review submission successful:", response.data);
        setShowReviewModal(false);
        setReviewData({ rating: 5, comment: "" });
        setCurrentTransaction(null);
        await fetchPendingReviews();
        alert("Review submitted successfully!");
      } catch (error) {
        console.error("Error submitting review:", error);
        if (error.response?.status === 429) {
          alert("You're submitting reviews too quickly. Please wait a moment and try again.");
        } else {
          alert(error.response?.data?.message || "Failed to submit review. Please try again.");
        }
      } finally {
        setSubmittingReview(false);
      }
    },
    [currentTransaction, fetchPendingReviews, reviewData, submittingReview]
  );

  const handleOpenChat = useCallback(
    (ownerId, resourceId, resourceTitle) => {
      if (!ownerId) {
        console.error("Owner ID is required for messaging");
        return;
      }
      navigate(
        `/messages?to=${ownerId}&resource=${resourceId}&resourceTitle=${encodeURIComponent(resourceTitle)}`
      );
    },
    [navigate]
  );

  const handleDeleteResource = useCallback(
    async (resourceId) => {
      if (!resourceId) {
        console.error("No resource ID provided for deletion");
        return;
      }
      try {
        setLoading(true);
        setResources((prev) => prev.filter((r) => r._id !== resourceId));
        await API.delete(`/resources/${resourceId}`);
        setError(null);
      } catch (error) {
        console.error("Error deleting resource:", error);
        setError("Failed to delete resource: " + error.message);
        fetchResources();
      } finally {
        setLoading(false);
      }
    },
    [fetchResources]
  );

  const handleShowReviewModal = useCallback((transaction) => {
    console.log("Opening review modal for transaction:", transaction);
    setCurrentTransaction(transaction);
    setShowReviewModal(true);
  }, []);

  // Filter resources based on search query and selected category
  const filteredResources = resources.filter((resource) => {
    const matchesQuery =
      searchQuery.trim() === "" ||
      resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resource.location &&
        resource.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      filterCategory === "" || resource.category === filterCategory;
    return matchesQuery && matchesCategory;
  });

  // Separate resources owned by the user vs. community resources
  const otherResources = filteredResources.filter(
    (r) => r.ownerId?._id !== userData?._id
  );

  // Debug logging
  useEffect(() => {
    console.log("Resources component state:", {
      loading,
      resourcesCount: resources?.length || 0,
      myResourcesCount: myResources?.length || 0,
      otherResourcesCount: otherResources?.length || 0,
      hasUserData: !!userData,
      searchQuery,
      filterCategory,
    });
  }, [loading, resources, myResources, otherResources, userData, searchQuery, filterCategory]);

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Resource Sharing</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources by title, description or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#69C143] hover:bg-[#5DAF3B] text-white px-4 py-2 rounded-lg flex items-center justify-center transition md:w-auto"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Share Resource
          </button>
        </div>
      </div>

      {/* Pending Reviews Section */}
      {pendingReviews &&
        ((Array.isArray(pendingReviews.pendingAsOwner) &&
          pendingReviews.pendingAsOwner.length > 0) ||
          (Array.isArray(pendingReviews.pendingAsBorrower) &&
            pendingReviews.pendingAsBorrower.length > 0)) && (
          <div className="mb-8 bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h2 className="text-lg font-medium mb-3">Pending Reviews</h2>
            {Array.isArray(pendingReviews.pendingAsOwner) &&
              pendingReviews.pendingAsOwner.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-amber-700 mb-2">
                    As Resource Owner:
                  </h3>
                  <ul className="space-y-2">
                    {pendingReviews.pendingAsOwner.map((transaction) => (
                      <li
                        key={transaction._id || Math.random()}
                        className="flex justify-between items-center"
                      >
                        <span>
                          <span className="font-medium">
                            {transaction.borrowerId?.name || "Someone"}
                          </span>{" "}
                          borrowed your{" "}
                          <span className="font-medium">
                            {transaction.resourceId?.title || "resource"}
                          </span>
                        </span>
                        <button
                          onClick={() => {
                            setCurrentTransaction(transaction);
                            setShowReviewModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
                        >
                          Review
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            {Array.isArray(pendingReviews.pendingAsBorrower) &&
              pendingReviews.pendingAsBorrower.length > 0 && (
                <div>
                  <h3 className="font-medium text-amber-700 mb-2">
                    As Borrower:
                  </h3>
                  <ul className="space-y-2">
                    {pendingReviews.pendingAsBorrower.map((transaction) => (
                      <li
                        key={transaction._id || Math.random()}
                        className="flex justify-between items-center"
                      >
                        <span>
                          You borrowed{" "}
                          <span className="font-medium">
                            {transaction.resourceId?.title || "a resource"}
                          </span>{" "}
                          from{" "}
                          <span className="font-medium">
                            {transaction.ownerId?.name || "someone"}
                          </span>
                        </span>
                        <button
                          onClick={() => {
                            setCurrentTransaction(transaction);
                            setShowReviewModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
                        >
                          Review
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}

      {/* Borrow Requests Section */}
      {myResources.length > 0 && (
        <div className="mb-8">
          <BorrowRequests onRequestProcessed={fetchResources} />
        </div>
      )}

      {/* My Resources Section */}
      {myResources.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">My Resources</h2>
            <p className="text-sm text-gray-500">
              {myResources.length}{" "}
              {myResources.length === 1 ? "resource" : "resources"}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myResources.map((resource) => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                userData={userData}
                onUpdate={handleToggleStatus}
                onOpenChat={handleOpenChat}
                onDelete={handleDeleteResource}
                onShowReviewModal={handleShowReviewModal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Community Resources Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Community Resources</h2>
          <p className="text-sm text-gray-500">
            {otherResources.length}{" "}
            {otherResources.length === 1 ? "resource" : "resources"}
          </p>
        </div>
        <div>
          {loading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#69C143]"></div>
            </div>
          ) : otherResources && Array.isArray(otherResources) ? (
            otherResources.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {otherResources.map((resource) => (
                  <ResourceCard
                    key={resource._id}
                    resource={resource}
                    userData={userData}
                    onUpdate={handleToggleStatus}
                    onOpenChat={handleOpenChat}
                    onShowReviewModal={handleShowReviewModal}
                  />
                ))}
              </div>
            ) : (
              <p>No resources found</p>
            )
          ) : (
            <p>Loading resources...</p>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddResourceModal
          setShowAddModal={setShowAddModal}
          newResource={newResource}
          setNewResource={setNewResource}
          handleAddResource={handleAddResource}
          loading={loading}
          categoryOptions={categoryOptions}
        />
      )}
      {showReviewModal && (
        <ReviewModal
          currentTransaction={currentTransaction}
          reviewData={reviewData}
          setReviewData={setReviewData}
          setShowReviewModal={setShowReviewModal}
          setCurrentTransaction={setCurrentTransaction}
          handleReviewSubmit={handleSubmitReview}
          loading={submittingReview}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export default Resources;
