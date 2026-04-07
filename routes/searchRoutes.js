const express = require('express');
const router = express.Router();
const {
  searchProviders,
  searchServices,
  autocomplete,
} = require('../controllers/searchController');

router.get('/services', searchServices);
router.get('/search', searchProviders);
router.get('/autocomplete', autocomplete);

module.exports = router;
