const Notification = require('../models/Notification');
const User = require('../models/User');

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
  try {
    const { notificationId } = req.params;
    const auth0Id = req.auth?.payload?.sub;

    // TODO: get user ID from auth token in middleware
    // and attach to req object to avoid querying DB for user here
    const user = await User.findOne({ auth0Id });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    if (!notificationId) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    const updated = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        user: user._id,
        status: 'unread',
      },
      { $set: { status: 'read' } },
      { new: true },
    ).lean();

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
