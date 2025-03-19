import express from "express";
import { body, param, query } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js"; 
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  cancelRsvp,
  getMyEvents,
  getEventsAttending
} from "../../controllers/event/eventController.js"; 

const router = express.Router();

// Validation middleware for Event Creation/Update
const validateEvent = [
  body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("date").isISO8601().withMessage("Valid date is required"),
  body("location").notEmpty().withMessage("Location is required"),
  body("category")
    .isIn(["Education", "Social", "Fitness", "Arts & Culture", "Technology", "Community Service", "Other"])
    .withMessage("Valid category is required")
];

// Validation middleware for Event ID
const validateEventId = [
  param("id").isMongoId().withMessage("Invalid Event ID format")
];

// Get all events (with optional filters)
router.get("/", getEvents);

// Create a new event (authenticated users)
router.post("/", protect, validateEvent, createEvent);

// Get events hosted by current user
router.get("/my-events", protect, getMyEvents);

// Get events user is attending
router.get("/attending", protect, getEventsAttending);

// Get, update, delete specific event
router.get("/:id", validateEventId, getEventById);
router.put("/:id", protect, validateEventId, validateEvent, updateEvent);
router.delete("/:id", protect, validateEventId, deleteEvent);

// RSVP routes
router.put("/:id/rsvp", protect, validateEventId, rsvpEvent);
router.put("/:id/cancel-rsvp", protect, validateEventId, cancelRsvp);

export default router;
