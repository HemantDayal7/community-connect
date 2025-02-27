import express from "express";
import { body, param } from "express-validator"; // ✅ Ensuring `body` is imported
import { protect } from "../../middleware/authMiddleware.js"; 
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  rsvpEvent,
} from "../../controllers/event/eventController.js"; 

const router = express.Router();

// ✅ Validation Middleware for Event Creation/Update
const validateEvent = [
  body("title").notEmpty().withMessage("Title is required"),
  body("date").isISO8601().withMessage("Invalid date format"),
  body("location").notEmpty().withMessage("Location is required"),
  body("hostId").isMongoId().withMessage("Invalid host ID"),
];

// ✅ Validation Middleware for Event ID
const validateEventId = [
  param("id").isMongoId().withMessage("Invalid Event ID format"),
];

// ✅ Validation Middleware for RSVP
const validateRSVP = [
  body("eventId").isMongoId().withMessage("Invalid Event ID"),
  body("userId").isMongoId().withMessage("Invalid User ID"),
];

// @route    GET /api/v1/events
// @desc     Get all events
router.get("/", getEvents);

// @route    POST /api/v1/events
// @desc     Create a new event (Authenticated Users)
router.post("/", protect, validateEvent, createEvent);

// @route    GET /api/v1/events/:id
// @desc     Get a single event by ID
router.get("/:id", validateEventId, getEventById);

// @route    PUT /api/v1/events/:id
// @desc     Update an event (Only Host)
router.put("/:id", protect, validateEventId, updateEvent);

// @route    DELETE /api/v1/events/:id
// @desc     Delete an event (Only Host)
router.delete("/:id", protect, validateEventId, deleteEvent);

// @route    POST /api/v1/events/rsvp
// @desc     RSVP to an event (Authenticated Users)
router.post("/rsvp", protect, validateRSVP, rsvpEvent);

export default router;
