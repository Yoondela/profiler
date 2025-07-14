const Profile = require('../models/Profile');
const User = require('../models/User');
const calculateProfileCompletion = require('../utils/calculateProfileCompletion');

// Create profile
const createProfile = async (req, res) => {
  try {
    const profileData = req.body;
    profileData.profileCompletion = calculateProfileCompletion(profileData);

    const savedProfile = await new Profile(profileData).save();
    res.status(201).json(savedProfile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all profiles
const getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', 'name email');
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get profile by userId
const getProfileByUserId = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate('user', 'name email');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get profile by email
const getProfileByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profile = await Profile.findOne({ user: user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    res.status(200).json({
      userAccount: {
        user: {
          name: user.name,
          email: user.email,
        },
        profile: {
          bio: profile.bio,
          phone: profile.phone,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get profile by profile ID
const getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id).populate('user');
    if (!profile) return res.status(404).json({ message: 'Not Found' });
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const updated = await Profile.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (updated) {
      updated.profileCompletion = calculateProfileCompletion(updated);
      await updated.save();
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete profile
const deleteProfile = async (req, res) => {
  try {
    await Profile.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createProfile,
  getAllProfiles,
  getProfileByUserId,
  getProfileByEmail,
  getProfileById,
  updateProfile,
  deleteProfile,
};
