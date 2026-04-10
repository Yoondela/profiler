const express = require('express');
const router = express.Router();

const { getFlackUserId, getFlackUserInfoByFlackId } = require('../controllers/flackController');
const checkJwt = require('../middleware/auth');

router.get('/me/:id', checkJwt, getFlackUserId);
router.get('/by-flack/:flackUserId', getFlackUserInfoByFlackId);

module.exports = router;
