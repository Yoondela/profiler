const express = require('express');
const multer = require('multer');
const cloudinary = require('../../config/cloudinary.js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('image'), async (req, res) => {
  console.log('Upload route hit');
  console.log(req.file);
  try {
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'profile_avatars',
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'upload failed' });
  }
});

module.exports = router;
