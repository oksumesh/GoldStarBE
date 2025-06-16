const mongoose = require('mongoose');

const MainContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }
}, { _id: false });

const SuburbSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  metaTitle: { type: String, required: true },
  metaDescription: { type: String, required: true },
  mainContent: [MainContentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Suburb', SuburbSchema); 