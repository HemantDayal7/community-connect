import Review from "../../models/Review.js";
import Transaction from "../../models/Transaction.js";
import User from "../../models/User.js";
import { validationResult } from "express-validator";

/**
 * @desc Create a new review
 * @route POST /api/v1/reviews
 * @access Private
 */
export const createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { transactionId, rating, comment } = req.body;
    const reviewerId = req.user._id;

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Verify transaction is completed
    if (transaction.status !== "returned") {
      return res.status(400).json({ 
        message: "You can only review after the resource has been returned" 
      });
    }

    // Check if user is part of the transaction
    const isOwner = transaction.ownerId.toString() === reviewerId.toString();
    const isBorrower = transaction.borrowerId.toString() === reviewerId.toString();

    if (!isOwner && !isBorrower) {
      return res.status(403).json({ 
        message: "You are not authorized to review this transaction" 
      });
    }

    // Determine who is being reviewed
    const reviewedUserId = isOwner ? transaction.borrowerId : transaction.ownerId;
    
    // Check if user has already reviewed this transaction
    if ((isOwner && transaction.ownerReviewed) || 
        (isBorrower && transaction.borrowerReviewed)) {
      return res.status(400).json({ message: "You have already reviewed this transaction" });
    }

    // Create the review
    const review = new Review({
      reviewerId,
      reviewedUserId,
      transactionId,
      resourceId: transaction.resourceId,
      rating,
      comment
    });

    await review.save();

    // Update transaction to mark as reviewed
    if (isOwner) {
      transaction.ownerReviewed = true;
    } else {
      transaction.borrowerReviewed = true;
    }
    await transaction.save();

    // Update the reviewed user's trust score
    const reviewedUser = await User.findById(reviewedUserId);
    const totalReviews = reviewedUser.totalReviews || 0;
    const currentScore = reviewedUser.trustScore || 5.0;
    
    // Calculate new trust score
    const newTotalReviews = totalReviews + 1;
    const newTrustScore = ((currentScore * totalReviews) + rating) / newTotalReviews;
    
    // Update the user
    reviewedUser.trustScore = Number(newTrustScore.toFixed(2));
    reviewedUser.totalReviews = newTotalReviews;
    await reviewedUser.save();

    res.status(201).json({ 
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    console.error("🔥 Error creating review:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * @desc Get reviews for a specific user
 * @route GET /api/v1/reviews/user/:userId
 * @access Public
 */
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const reviews = await Review.find({ reviewedUserId: userId })
      .populate("reviewerId", "name")
      .populate("resourceId", "title")
      .sort("-createdAt");
    
    res.status(200).json(reviews);
  } catch (error) {
    console.error("🔥 Error fetching user reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * @desc Get pending reviews for the logged-in user
 * @route GET /api/v1/reviews/pending
 * @access Private
 */
export const getPendingReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("🔍 Fetching pending reviews for user:", userId);
    
    // Debug: Check all transactions for this user
    const allTransactions = await Transaction.find({
      $or: [{ ownerId: userId }, { borrowerId: userId }]
    });
    console.log("📊 All transactions:", allTransactions.length);
    console.log("📊 Transactions by status:", 
      allTransactions.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {})
    );
    
    // Find transactions where this user is involved and hasn't reviewed yet
    const pendingAsOwner = await Transaction.find({
      ownerId: userId,
      ownerReviewed: false,
      status: "returned"
    }).populate("resourceId", "title")
      .populate("borrowerId", "name");
      
    const pendingAsBorrower = await Transaction.find({
      borrowerId: userId,
      borrowerReviewed: false,
      status: "returned"
    }).populate("resourceId", "title")
      .populate("ownerId", "name");
    
    res.status(200).json({
      pendingAsOwner,
      pendingAsBorrower
    });
  } catch (error) {
    console.error("🔥 Error fetching pending reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};