import express from "express";
import { check } from "express-validator";
import { protect } from "../../middleware/authMiddleware.js"; // ✅ Fix path
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../../controllers/event/eventController.js"; // ✅ Fix path

const router = express.Router();

// @route    POST /events
// @desc     Create a new event
// @access   Private (Requires Auth)
router.post(
  "/",
  protect,
  [
    check("title", "Title is required").not().isEmpty(),
    check("date", "Valid date is required").isISO8601(),
    check("location", "Location is required").not().isEmpty(),
  ],
  createEvent
);

// @route    GET /events
// @desc     Get all events
// @access   Public
router.get("/", getEvents);

// @route    GET /events/:id
// @desc     Get event details
// @access   Public
router.get("/:id", getEventById);

// @route    PUT /events/:id
// @desc     Update an event
// @access   Private (Only Host can update)
router.put("/:id", protect, updateEvent);

// @route    DELETE /events/:id
// @desc     Delete an event
// @access   Private (Only Host can delete)
router.delete("/:id", protect, deleteEvent);

export default router; // ✅ Ensure default export
