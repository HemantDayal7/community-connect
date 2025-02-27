import Event from "../../models/Event.js"; 
import { validationResult } from "express-validator";

// ✅ Get all events
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("hostId", "name email");
    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error("🔥 Error fetching events:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Create a new event
export const createEvent = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, date, location, hostId } = req.body;

    const event = new Event({ title, date, location, hostId });
    await event.save();

    res.status(201).json({ success: true, message: "✅ Event created successfully", event });
  } catch (error) {
    console.error("🔥 Error creating event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Get event by ID
export const getEventById = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const event = await Event.findById(req.params.id).populate("hostId", "name email");
    if (!event) {
      return res.status(404).json({ success: false, message: "❌ Event not found" });
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    console.error("🔥 Error fetching event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Update event (Only Host can update)
export const updateEvent = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "❌ Event not found" });
    }

    // Only event host can update
    if (event.hostId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "🚫 Not authorized" });
    }

    Object.assign(event, req.body);
    await event.save();

    res.status(200).json({ success: true, message: "✅ Event updated", event });
  } catch (error) {
    console.error("🔥 Error updating event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Delete event (Only Host can delete)
export const deleteEvent = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "❌ Event not found" });
    }

    // Only event host can delete
    if (event.hostId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "🚫 Not authorized" });
    }

    await event.deleteOne();
    res.status(200).json({ success: true, message: "✅ Event deleted" });
  } catch (error) {
    console.error("🔥 Error deleting event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ RSVP to an event
export const rsvpEvent = async (req, res) => {
  // ✅ Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { eventId, userId } = req.body;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "❌ Event not found" });
    }

    if (!event.attendees.includes(userId)) {
      event.attendees.push(userId);
      await event.save();
    }

    res.status(200).json({ success: true, message: "✅ RSVP successful" });
  } catch (error) {
    console.error("🔥 Error RSVPing to event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
