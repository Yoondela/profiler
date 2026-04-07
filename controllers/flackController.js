const User = require('../models/User');
const Profile = require('../models/Profile');

const getFlackUserId = async (req, res) => {
  console.log('Getting flack user..');
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'userId query parameter is required' });
    }

    const user = await User.findById(id).select('flackUserId').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ flackUserId: user.flackUserId });
    console.log('Successful!');
  } catch (err) {
    console.error('Get flack user id error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

const getFlackUserInfoByFlackId = async (req, res) => {
  console.log('Getting flack user info by flackUserId..');
  try {
    const { flackUserId } = req.params;

    if (!flackUserId) {
      return res.status(400).json({ message: 'flackUserId query parameter is required' });
    }

    const user = await User.findOne({ flackUserId }).select('name email flackUserId').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = await Profile.findOne({ user: user._id }).select('avatarUrl').lean();

    res.status(200).json({
      name: user.name,
      email: user.email,
      flackUserId: user.flackUserId,
      avatarUrl: profile?.avatarUrl || '',
    });
    console.log('Successful!');
  } catch (err) {
    console.error('Get flack user info error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getFlackUserId, getFlackUserInfoByFlackId };
