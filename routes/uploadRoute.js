// routes/upload.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const cloudinary = require('../middleware/cloudinary');
const streamifier = require('streamifier');

function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    uploadStream.on('error', (err) => {
      console.error('Cloudinary upload stream error:', err);
      reject(err);
    });

    const readStream = streamifier.createReadStream(buffer);

    readStream.on('error', (err) => {
      console.error('Readable stream error:', err);
      reject(err);
    });

    readStream.pipe(uploadStream);
  });
}


router.post('/upload', upload.single('image'), async (req, res) => {
  console.log('Uploading avatar via stream...');
  console.log(req.file);

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'profile_pics',
    });

    return res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Cloudinary error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

module.exports = router;
