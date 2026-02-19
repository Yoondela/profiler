const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  console.log('Getting notifications..');
  console.log('Make sure to get ID from auth token in future, not params');
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({
      user: userId,
      status: 'unread',
      resolved: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(notifications);
    console.log('Successful!');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotifications };
