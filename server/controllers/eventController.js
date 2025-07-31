const Event = require('../models/Event');

exports.getEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;
    const total = await Event.countDocuments();
    const events = await Event.find().sort({ date: -1 }).skip(skip).limit(limit);
    res.json({ events, totalPages: Math.ceil(total / limit), page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEventBySlug = async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
