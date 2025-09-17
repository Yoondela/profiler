// testCloudinary.js
require('dotenv').config();
const express = require('express');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Base64-encoded 1x1 PNG pixel
const pixel =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

router.get('/test-cloudinary', async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(pixel, {
      folder: 'test_uploads',
    });
    res.json({
      success: true,
      message: 'Cloudinary credentials work!',
      url: result.secure_url,
    });
  } catch (err) {
    console.error('Cloudinary test error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Unknown Cloudinary error',
      details: err,
    });
  }
});

module.exports = router;
