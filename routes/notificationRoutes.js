const express = require('express');
const router = express.Router();

const { getNotifications, getReadNotifications, markNotificationRead } = require('../controllers/notificationController');

const checkJwt = require('../middleware/auth');

router.get('/:userId', getNotifications);
router.get('/:userId/read', getReadNotifications);
router.patch('/:notificationId/update/read', checkJwt, markNotificationRead);

module.exports = router;
