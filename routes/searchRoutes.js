const express = require('express');
const router = express.Router();
const { searchProviders } = require('../controllers/searchController');

router.get('/search', searchProviders);

module.exports = router;
