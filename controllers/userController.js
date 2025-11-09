// backend/controllers/userController.js

const User = require('../models/User');
const Profile = require('../models/Profile');
const calculateProfileCompletion = require('../utils/calculateProfileCompletion');

function generateUsername(auth0Id) {
  return `user_${auth0Id.slice(-6)}`;
}

const createUser = async (req, res) => {
  console.log('Running POST method');

  try {
    const { name, email, sub: auth0Id } = req.body;

    const isDefaultName = name === email;
    const defaultName = isDefaultName ? generateUsername(auth0Id) : name;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: defaultName,
        email,
      });
      await user.save();
    }

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
          { label: 'Work', address: '12 Roodebloem Rd, Woodstock' },
        ],
      };

      profileData.profileCompletion = calculateProfileCompletion(profileData);
      profile = new Profile(profileData);
      await profile.save();
    }

    res.status(201).json({ newUser: user, profile });

  } catch (err) {
    console.error('Create user error:', err.message);
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

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message });
  }
};

const getUserByEmail = async (req, res) => {
  console.log('Getting user by email');
  try {
    const { email } = req.params;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user); // ✅ End the response properly
    console.log('Successful');
  } catch (err) {
    console.error('Get user by email error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Profile.deleteOne({ user: id });
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'User and profile deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  deleteUser,
};
