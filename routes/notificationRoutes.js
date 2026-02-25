const express = require('express');
const router = express.Router();

const { getNotifications, getReadNotifications, markNotificationRead } = require('../controllers/notificationController');

router.get('/:userId', getNotifications);
router.get('/:userId/read', getReadNotifications);
router.patch('/:notificationId/update/read', markNotificationRead);

module.exports = router;
