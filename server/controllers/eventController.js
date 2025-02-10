const Event = require("../models/Event");
const { validationResult } = require("express-validator");

// @route    POST /events
// @desc     Create a new event
exports.createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, date, location } = req.body;

  try {
    const newEvent = new Event({
      title,
      date,
      location,
      hostId: req.user.id
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route    GET /events
// @desc     Get all events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("hostId", "name email");
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route    GET /events/:id
// @desc     Get event details
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("hostId", "name email");
    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route    PUT /events/:id
// @desc     Update an event
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }

    // Only host can update the event
    if (event.hostId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route    DELETE /events/:id
// @desc     Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }

    // Only host can delete the event
    if (event.hostId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    await event.deleteOne();
    res.json({ msg: "Event deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
