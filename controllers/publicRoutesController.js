// controllers/providerPublicController.js
const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');

exports.getPublicProvider = async (req, res) => {
  try {
    const { id } = req.params;

    // Load user with provider role
    const user = await User.findById(id);
    if (!user || !user.roles.includes('provider')) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Load related profile & portfolio
    const profile = await Profile.findOne({ user: id });
    const portfolio = await Portfolio.findOne({ user: id });

    if (!profile || !portfolio) {
      return res.status(404).json({ message: 'Provider profile incomplete' });
    }

    return res.status(200).json({
      user,
      profile,
      portfolio,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
