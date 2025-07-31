const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  summary: String,
  content: String,
  author: String,
  image: String,
  publishedAt: Date,
  tags: [String],
  featured: { type: Boolean, default: false }
});

BlogSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
  next();
});

module.exports = mongoose.model('Blog', BlogSchema);
