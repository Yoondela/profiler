// controllers/userController.js
const User = require('../models/User');
const Profile = require('../models/Profile');
const calculateProfileCompletion = require('../utils/calculateProfileCompletion');

const createUser = async (req, res) => {
  console.log('Running POST method');
  try {
    const { name, email } = req.body;

    // 🔍 Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ name, email });
      await user.save();
    }

    // 🔍 Check if profile exists
    let profile = await Profile.findOne({ user: user._id });

    if (!profile) {
      const profileData = {
        user: user._id,
        bio: '',
        phone: '',
        address: '',
        preferredContactMethod: 'sms',
        notificationSettings: { email: true, sms: true },
        savedAddresses: [
          { label: 'Home', address: '01 Shannon Rd, Salt River' },
          { label: 'Work', address: '12 Roodebloem Rd, Woodstock' }
        ]
      };

      profileData.profileCompletion = calculateProfileCompletion(profileData);
      profile = new Profile(profileData);
      await profile.save();
    }

    res.status(201).json({ newUser: user, profile });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createUser,
  getAllUsers
};
