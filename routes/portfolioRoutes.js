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
} = require('../controllers/galleryController');

// router.get('/:providerId', portfolioNotfound);
router.get('/:providerId', getPortfolio);
router.patch('/:providerId', updatePortfolio);
router.post('/:providerId/gallery', addGalleryPhotos);
router.delete('/:providerId/gallery/:index', deleteGalleryPhoto);
router.patch('/:id/gallery/reorder', reorderGalleryPhoto);


module.exports = router;

