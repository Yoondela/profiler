const express = require('express');
const checkJwt = require('../middleware/auth');
const {
  createServiceReview,
  getProviderServiceReviews,
  getProviderStats,
} = require('../controllers/serviceReviewController');
const {
  createProviderReview,
  toggleFeatureReview,
  getProviderReviews,
} = require('../controllers/providerReviewController');
const router = express.Router();

router.post('/service', checkJwt, createServiceReview);
router.get('/service/provider/:providerId', getProviderServiceReviews);
router.get('/service/provider/:providerId/stats', getProviderStats);

router.post('/provider', checkJwt, createProviderReview);
router.patch('/provider/:id/feature', checkJwt, toggleFeatureReview);
router.get('/provider/p/:providerId', checkJwt, getProviderReviews);


module.exports = router;
