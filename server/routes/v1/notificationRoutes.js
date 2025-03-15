import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from "../../controllers/notification/notificationController.js";

const router = express.Router();

// Get all notifications for the current user
router.get("/", protect, getUserNotifications);

// Mark specific notification as read
router.put("/:id/read", protect, markNotificationAsRead);

// Mark all notifications as read
router.put("/read-all", protect, markAllNotificationsAsRead);

// Delete a notification
router.delete("/:id", protect, deleteNotification);

export default router;