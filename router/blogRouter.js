const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/blog');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'));
    }
  }
});

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ date: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single blog post by slug
router.get('/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new blog post
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, description, content, date, slug, image } = req.body;

    let imageData = null;

    // Handle image data
    if (image) {
      // For base64 image
      const base64Data = image.split(';base64,').pop();
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Compress image
      const compressedImageBuffer = await sharp(imageBuffer)
        .resize(800) // Resize to max width of 800px
        .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
        .toBuffer();
      
      // Convert back to base64
      imageData = `data:image/jpeg;base64,${compressedImageBuffer.toString('base64')}`;
    } else if (req.file) {
      // For file upload
      const compressedImageBuffer = await sharp(req.file.path)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();
      
      imageData = `data:image/jpeg;base64,${compressedImageBuffer.toString('base64')}`;
    }

    const blog = new Blog({
      title,
      description,
      content,
      date: date || new Date(),
      slug,
      image: imageData
    });

    const newBlog = await blog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    console.error('Blog creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update blog post
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Handle image update
    if (updates.image) {
      // For base64 image
      const base64Data = updates.image.split(';base64,').pop();
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Compress image
      const compressedImageBuffer = await sharp(imageBuffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();
      
      // Convert back to base64
      updates.image = `data:image/jpeg;base64,${compressedImageBuffer.toString('base64')}`;
    } else if (req.file) {
      // For file upload
      const compressedImageBuffer = await sharp(req.file.path)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();
      
      updates.image = `data:image/jpeg;base64,${compressedImageBuffer.toString('base64')}`;
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id, 
      updates,
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json(blog);
  } catch (error) {
    console.error('Blog update error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete blog post
router.delete('/:id', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.json({ message: 'Blog post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;