const express = require('express');
const router = express.Router();

const {
  getPortfolio,
  updatePortfolio,
} = require('../controllers/portfolioController');

const {
  addGalleryPhotos,
  deleteGalleryPhoto,
  reorderGalleryPhoto,
  getGalleryPhotos,
} = require('../controllers/galleryController');

// router.get('/:providerId', portfolioNotfound);
router.get('/:providerId', getPortfolio);
router.patch('/:providerId', updatePortfolio);
router.post('/:providerId/gallery', addGalleryPhotos);
router.delete('/:providerId/gallery/:photoId', deleteGalleryPhoto);
router.patch('/:providerId/gallery/reorder', reorderGalleryPhoto);
router.get('/:providerId/gallery', getGalleryPhotos);

module.exports = router;

