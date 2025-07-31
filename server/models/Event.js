const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  date: Date,
  location: String,
  image: String,
  link: String,
  featured: { type: Boolean, default: false }
});

EventSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
  next();
});

module.exports = mongoose.model('Event', EventSchema);
