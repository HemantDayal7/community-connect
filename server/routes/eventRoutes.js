const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { protect } = require("../middleware/authMiddleware"); // ✅ Correct Import

// @route    POST /events
// @desc     Create a new event
// @access   Private (Requires Auth)
router.post(
  "/",
  protect, // ✅ Use the function correctly
  [
    check("title", "Title is required").not().isEmpty(),
    check("date", "Valid date is required").isISO8601(),
    check("location", "Location is required").not().isEmpty(),
  ],
  eventController.createEvent
);

// @route    GET /events
// @desc     Get all events
// @access   Public
router.get("/", eventController.getEvents);

// @route    GET /events/:id
// @desc     Get event details
// @access   Public
router.get("/:id", eventController.getEventById);

// @route    PUT /events/:id
// @desc     Update an event
// @access   Private (Only Host can update)
router.put("/:id", protect, eventController.updateEvent);

// @route    DELETE /events/:id
// @desc     Delete an event
// @access   Private (Only Host can delete)
router.delete("/:id", protect, eventController.deleteEvent);

module.exports = router;
