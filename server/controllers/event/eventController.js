import Event from "../../models/Event.js"; // ✅ Fixed import path
import { validationResult } from "express-validator";

// @route    POST /events
// @desc     Create a new event
// @access   Private (Requires Auth)
export const createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, date, location, hostId } = req.body;
  try {
    const event = new Event({ title, date, location, hostId });
    await event.save();
    res.status(201).json({ success: true, message: "Event created successfully", event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @route    GET /events
// @desc     Get all events
// @access   Public
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @route    POST /events/rsvp
// @desc     RSVP to an event
// @access   Private (Requires Auth)
export const rsvpEvent = async (req, res) => {
  const { eventId, userId } = req.body;
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    if (!event.attendees.includes(userId)) {
      event.attendees.push(userId);
      await event.save();
    }
    res.status(200).json({ success: true, message: "RSVP successful" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @route    GET /events/:id
// @desc     Get event details
// @access   Public
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("hostId", "name email");
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @route    PUT /events/:id
// @desc     Update an event
// @access   Private (Only Host can update)
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Only host can update the event
    if (event.hostId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    Object.assign(event, req.body);
    await event.save();
    res.status(200).json({ success: true, message: "Event updated", event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @route    DELETE /events/:id
// @desc     Delete an event
// @access   Private (Only Host can delete)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Only host can delete the event
    if (event.hostId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await event.deleteOne();
    res.status(200).json({ success: true, message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
