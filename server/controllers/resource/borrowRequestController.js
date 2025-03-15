import BorrowRequest from '../../models/BorrowRequest.js';
import Resource from '../../models/Resource.js';
import Notification from '../../models/Notification.js';
import { validationResult } from 'express-validator';

/**
 * @desc Create a borrow request
 * @route POST /api/v1/resources/borrow-request
 * @access Private
 */
export const createBorrowRequest = async (req, res) => {
  const { resourceId } = req.body;
  const borrowerId = req.user._id;

  try {
    // Check if resource exists
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if resource is available
    if (resource.availability !== 'available') {
      return res.status(400).json({ message: 'Resource is not available for borrowing' });
    }

    // Check if user is trying to borrow their own resource
    if (resource.ownerId.toString() === borrowerId.toString()) {
      return res.status(400).json({ message: 'You cannot borrow your own resource' });
    }

    // Check if there's already a pending request
    const existingRequest = await BorrowRequest.findOne({
      resourceId,
      borrowerId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this resource' });
    }

    // Create borrow request
    const borrowRequest = await BorrowRequest.create({
      resourceId,
      borrowerId,
      status: 'pending'
    });

    // Notify owner (optional)
    if (req.app.get('io')) {
      const notification = new Notification({
        userId: resource.ownerId,
        message: `${req.user.name} wants to borrow your resource: ${resource.title}`,
        type: 'borrow_request',
        resourceId: resource._id
      });
      await notification.save();

      const io = req.app.get('io');
      io.to(resource.ownerId.toString()).emit('notification', notification);
    }

    res.status(201).json({
      message: 'Borrow request created successfully',
      borrowRequest
    });
  } catch (error) {
    console.error('Error creating borrow request:', error);
    res.status(500).json({ error: 'Failed to create borrow request' });
  }
};

/**
 * @desc Get all borrow requests for current user (as owner)
 * @route GET /api/v1/resources/borrow-requests
 * @access Private
 */
export const getMyBorrowRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find resources owned by the user
    const userResources = await Resource.find({ ownerId: userId });
    const resourceIds = userResources.map(resource => resource._id);

    // Find pending borrow requests for those resources
    const pendingRequests = await BorrowRequest.find({
      resourceId: { $in: resourceIds },
      status: 'pending'
    })
      .populate('resourceId', 'title image')
      .populate('borrowerId', 'name trustScore');

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error('Error fetching borrow requests:', error);
    res.status(500).json({ error: 'Failed to fetch borrow requests' });
  }
};

/**
 * @desc Update a borrow request (approve/decline)
 * @route PUT /api/v1/resources/borrow-request/:id
 * @access Private
 */
export const updateBorrowRequest = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  const userId = req.user._id;

  try {
    const borrowRequest = await BorrowRequest.findById(id)
      .populate('resourceId')
      .populate('borrowerId', 'name');

    if (!borrowRequest) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }

    const resource = borrowRequest.resourceId;

    if (resource.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the resource owner can update this request' });
    }

    if (action === 'approve') {
      borrowRequest.status = 'approved';
      await borrowRequest.save();

      resource.availability = 'borrowed';
      resource.borrowedBy = borrowRequest.borrowerId;
      await resource.save();

      // Get fully populated resource to return and emit
      const populatedResource = await Resource.findById(resource._id)
        .populate("ownerId", "name trustScore")
        .populate("borrowedBy", "name trustScore");

      // Emit event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.emit('resource-updated', populatedResource);
        io.to(borrowRequest.borrowerId.toString()).emit('notification', {
          message: `Your request to borrow ${resource.title} has been approved`,
          type: 'request_approved',
          resourceId: resource._id
        });
      }

      res.status(200).json({
        message: 'Borrow request approved',
        borrowRequest,
        resource: populatedResource
      });
    } else if (action === 'decline') {
      // Update borrow request status
      borrowRequest.status = 'declined';
      await borrowRequest.save();

      // Notify borrower
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(borrowRequest.borrowerId.toString()).emit('notification', {
          message: `Your request to borrow ${resource.title} has been declined`,
          type: 'request_declined',
          resourceId: resource._id
        });
      }

      res.status(200).json({
        message: 'Borrow request declined',
        borrowRequest
      });
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error updating borrow request:', error);
    res.status(500).json({ error: 'Failed to update borrow request' });
  }
};