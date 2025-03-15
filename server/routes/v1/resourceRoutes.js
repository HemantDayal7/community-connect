import express from 'express';
import { protect } from '../../middleware/authMiddleware.js';
// FIXED: Use correct path for upload middleware
import upload from '../../middleware/fileUpload.js';
import {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
  updateResourceStatus,
  returnResource
} from '../../controllers/resource/resourceController.js';
import {
  createBorrowRequest,
  getMyBorrowRequests,
  updateBorrowRequest
} from '../../controllers/resource/borrowRequestController.js';

const router = express.Router();

// Public routes
router.get('/', getAllResources);

// FIXED: Specific routes BEFORE dynamic routes with ID parameters
router.post('/borrow-request', protect, createBorrowRequest);
router.get('/borrow-requests', protect, getMyBorrowRequests);
router.put('/borrow-request/:id', protect, updateBorrowRequest);
router.put('/return/:id', protect, returnResource);

// Dynamic routes with ID parameters AFTER specific routes
router.get('/:id', getResourceById);
router.post('/', protect, upload.single('image'), createResource);
router.put('/:id', protect, updateResource);
router.delete('/:id', protect, deleteResource);
router.put('/:id/status', protect, updateResourceStatus);

export default router;
