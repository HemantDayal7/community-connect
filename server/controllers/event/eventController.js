import Event from "../../models/Event.js"; 
import User from "../../models/User.js";
import Notification from "../../models/Notification.js";
import { validationResult } from "express-validator";

// Get all events
export const getEvents = async (req, res) => {
  try {
    // Support filtering by category
    const filter = {};
    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }
    
    // Support filtering by upcoming/past
    if (req.query.timeframe === "upcoming") {
      filter.date = { $gte: new Date() };
    } else if (req.query.timeframe === "past") {
      filter.date = { $lt: new Date() };
    }
    
    const events = await Event.find(filter)
      .populate("hostId", "name email trustScore")
      .populate("attendees", "name")
      .sort({ date: req.query.timeframe === "past" ? -1 : 1 });
    
    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error("🔥 Error fetching events:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new event
export const createEvent = async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, date, location, category } = req.body;

    const event = new Event({
      title,
      description, 
      date,
      location,
      category,
      hostId: req.user._id // Use authenticated user as host
    });
    
    await event.save();
    
    const populatedEvent = await Event.findById(event._id)
      .populate("hostId", "name email");
    
    res.status(201).json({ 
      success: true, 
      message: "Event created successfully", 
      event: populatedEvent 
    });
  } catch (error) {
    console.error("🔥 Error creating event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const event = await Event.findById(req.params.id)
      .populate("hostId", "name email trustScore")
      .populate("attendees", "name email");
      
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    console.error("🔥 Error fetching event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update event (Only Host can update)
export const updateEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }

    // Only event host can update
    if (event.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to edit this event" 
      });
    }

    const updatedFields = {};
    
    // Only update fields that were provided
    if (req.body.title) updatedFields.title = req.body.title;
    if (req.body.description) updatedFields.description = req.body.description;
    if (req.body.date) updatedFields.date = req.body.date;
    if (req.body.location) updatedFields.location = req.body.location;
    if (req.body.category) updatedFields.category = req.body.category;
    if (req.body.status) updatedFields.status = req.body.status;

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id, 
      updatedFields, 
      { new: true }
    ).populate("hostId", "name email");

    // Notify attendees about the update
    if (event.attendees.length > 0) {
      const notifications = event.attendees.map(attendeeId => ({
        userId: attendeeId,
        message: `Event "${event.title}" has been updated by the host.`,
        type: "event_update",
        isRead: false
      }));
      
      await Notification.insertMany(notifications);
    }

    res.status(200).json({ 
      success: true, 
      message: "Event updated successfully", 
      event: updatedEvent 
    });
  } catch (error) {
    console.error("🔥 Error updating event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete event (Only Host can delete)
export const deleteEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }

    // Only event host can delete
    if (event.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to delete this event" 
      });
    }
    
    // Notify attendees about cancellation before deleting
    if (event.attendees.length > 0) {
      const notifications = event.attendees.map(attendeeId => ({
        userId: attendeeId,
        message: `Event "${event.title}" has been canceled.`,
        type: "event_canceled",
        isRead: false
      }));
      
      await Notification.insertMany(notifications);
    }

    await event.deleteOne();
    res.status(200).json({ 
      success: true, 
      message: "Event deleted successfully" 
    });
  } catch (error) {
    console.error("🔥 Error deleting event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// RSVP to an event
export const rsvpEvent = async (req, res) => {
  const { id } = req.params;
  
  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }
    
    // Check if event date has passed
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot RSVP to past events" 
      });
    }
    
    // Check if user is already attending
    if (event.attendees.includes(req.user._id)) {
      return res.status(400).json({ 
        success: false, 
        message: "You are already registered for this event" 
      });
    }
    
    // Add user to attendees
    event.attendees.push(req.user._id);
    event.attendeeCount = event.attendees.length;
    await event.save();
    
    // Create notification for event host
    await Notification.create({
      userId: event.hostId,
      message: `${req.user.name || "Someone"} has RSVP'd to your event "${event.title}".`,
      type: "event_rsvp",
      isRead: false
    });
    
    res.status(200).json({ 
      success: true, 
      message: "Successfully RSVP'd to event",
      event
    });
  } catch (error) {
    console.error("🔥 Error RSVPing to event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cancel RSVP to an event
export const cancelRsvp = async (req, res) => {
  const { id } = req.params;
  
  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }
    
    // Check if user is actually attending
    if (!event.attendees.includes(req.user._id)) {
      return res.status(400).json({ 
        success: false, 
        message: "You are not registered for this event" 
      });
    }
    
    // Remove user from attendees
    event.attendees = event.attendees.filter(
      id => id.toString() !== req.user._id.toString()
    );
    event.attendeeCount = event.attendees.length;
    await event.save();
    
    res.status(200).json({ 
      success: true, 
      message: "Successfully canceled RSVP",
      event
    });
  } catch (error) {
    console.error("🔥 Error canceling RSVP:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get events hosted by the current user
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ hostId: req.user._id })
      .populate("hostId", "name email")
      .populate("attendees", "name email")
      .sort({ date: 1 });
    
    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error("🔥 Error fetching user events:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get events that the current user is attending
export const getEventsAttending = async (req, res) => {
  try {
    const events = await Event.find({ 
      attendees: req.user._id,
      date: { $gte: new Date() } // Only upcoming events
    })
      .populate("hostId", "name email")
      .sort({ date: 1 });
    
    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error("🔥 Error fetching events attending:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
