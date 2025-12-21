const express = require('express');
const router = express.Router();
const { searchProviders } = require('../controllers/searchController');
const { autocomplete } = require('../controllers/searchController');

router.get('/search', searchProviders);
router.get('/autocomplete', autocomplete);

module.exports = router;
