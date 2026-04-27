const express = require('express');
const checkJwt = require('../middleware/auth');
const {
  toggleBookmark,
  getBookmarks,
  deleteBookmark,
} = require('../controllers/bookmarkController');

const router = express.Router();

router.post('/providers/save', checkJwt, toggleBookmark);
router.get('/providers/saved', checkJwt, getBookmarks);
router.delete('/providers/save/:providerId', checkJwt, deleteBookmark);



module.exports = router;
