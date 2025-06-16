const express = require('express');
const router = express.Router();
const Suburb = require('../models/Suburb');

// Placeholder for admin authentication middleware
const adminAuth = (req, res, next) => {
  // TODO: Implement real authentication
  next();
};

// Get all suburbs
router.get('/', async (req, res) => {
  try {
    const suburbs = await Suburb.find().sort({ name: 1 });
    res.json(suburbs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get suburb by slug
router.get('/:slug', async (req, res) => {
  try {
    const suburb = await Suburb.findOne({ slug: req.params.slug });
    if (!suburb) return res.status(404).json({ error: 'Suburb not found' });
    res.json(suburb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create suburb (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const suburb = new Suburb(req.body);
    await suburb.save();
    res.status(201).json(suburb);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update suburb (admin only)
router.put('/:slug', adminAuth, async (req, res) => {
  try {
    const suburb = await Suburb.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true }
    );
    if (!suburb) return res.status(404).json({ error: 'Suburb not found' });
    res.json(suburb);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete suburb (admin only)
router.delete('/:slug', adminAuth, async (req, res) => {
  try {
    const suburb = await Suburb.findOneAndDelete({ slug: req.params.slug });
    if (!suburb) return res.status(404).json({ error: 'Suburb not found' });
    res.json({ message: 'Suburb deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk create suburbs from a list of names
router.post('/bulk', adminAuth, async (req, res) => {
  try {
    const { names } = req.body;
    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: 'Names array is required' });
    }
    const toInsert = names.map(name => {
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      return {
        name,
        slug,
        title: `Bond Cleaning ${name}`,
        description: `Professional bond cleaning services in ${name}.` ,
        metaTitle: `Bond Cleaning ${name} | Gold Star Bond Cleaning`,
        metaDescription: `Get expert bond cleaning in ${name} with 100% bond back guarantee. Book your end of lease clean today!`,
        mainContent: [
          { title: 'Professional Cleaning Services', content: `Our team provides thorough cleaning in ${name}.` }
        ]
      };
    });
    const result = await Suburb.insertMany(toInsert, { ordered: false });
    res.status(201).json({ inserted: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 