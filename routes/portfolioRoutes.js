const express = require('express');
const router = express.Router();

const {
  getPortfolio,
  updatePortfolio,
} = require('../controllers/portfolioController');

// router.get('/:providerId', portfolioNotfound);
router.get('/:providerId', getPortfolio);
router.patch('/:providerId', updatePortfolio);

module.exports = router;

