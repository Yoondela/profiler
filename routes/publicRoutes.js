// routes/providers.js
const express = require('express');
const router = express.Router();

const { getPublicProvider } = require('../controllers/publicRoutesController');

router.get('/:id/public', getPublicProvider);

module.exports = router;
