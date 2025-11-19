const express = require('express');

const { uploadGalleryImages } = require('../../controllers/galleryController.js');
const upload = require('../../middleware/multer.js');

const router = express.Router();

// Gallery upload route
router.post('/gallery-images', upload.array('images'), uploadGalleryImages);

module.exports = router;
