const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  console.log('Getting notifications..');
  console.log('Make sure to get ID from auth token in future, not params');
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({
      user: userId,
      resolved: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    const normalized = notifications.map((n) => ({
      id: n._id.toString(),
      user: n.user.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      entityType: n.entityType,
      entityId: n.entityId?.toString(),
      actions: n.actions,
      status: n.status,
      resolved: n.resolved,
      createdAt: n.createdAt,
    }));

    res.json(normalized);
    console.log('Successful!');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const markNotificationRead = async (req, res) => {
  console.log('Marking notification read..');
  console.log(req.params);
  console.log(req.auth);
  try {
    const { notificationId } = req.params;
    const authUserId = req.auth?.payload?.sub;
    console.log('Notification ID to mark read:', notificationId);

    if (!notificationId) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    const updated = await Notification.findByIdAndUpdate(
      {_id: notificationId, user: authUserId, status: 'unread' },
      { $set: { status: 'read' } },
      { new: true },
    ).lean();

    console.log('Updated notification:', updated);

    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      id: updated._id.toString(),
      status: updated.status,
    });

    console.log('Successful!');

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


const getReadNotifications = async (req, res) => {
  console.log('Getting read notifications..');
  console.log('Make sure to get ID from auth token in future, not params');
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({
      user: userId,
      status: 'read',
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

module.exports = { getNotifications, getReadNotifications, markNotificationRead };
