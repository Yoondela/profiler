const express = require('express');
const checkJwt = require('../middleware/auth');
const {
  toggleBookmark,
  getBookmarks,
} = require('../controllers/bookmarkController');

const router = express.Router();

router.post('/providers/save', checkJwt, toggleBookmark);
router.get('/providers/:providerId', checkJwt, getBookmarks);



module.exports = router;
