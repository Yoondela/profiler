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
          address: profile.address,
          preferredContactMethod: profile.preferredContactMethod,
          notificationSettings: profile.notificationSettings,
          savedAddresses: profile.savedAddresses,
          createdAt: profile.createdAt,
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

const updateProfileByEmail = async (req, res) => {
  try {
    const email = req.params.email;

    // Step 1: Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Step 2: Find profile by user ID
    const profile = await Profile.findOne({ user: user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Step 3: Optional name update logic
    const shouldReplaceName = (
      req.body.name !== undefined &&
      req.body.name !== user.name &&
      !req.body.name.includes('user_')
    );

    if (shouldReplaceName) {
      user.name = req.body.name;
      await user.save(); // 💾 Important to persist the name change
    }

    // Step 4: Update profile fields if present
    if (req.body.bio !== undefined) profile.bio = req.body.bio;
    if (req.body.phone !== undefined) profile.phone = req.body.phone;
    if (req.body.address !== undefined) profile.address = req.body.address;
    if (req.body.preferredContactMethod !== undefined) {
      profile.preferredContactMethod = req.body.preferredContactMethod;
    }
    if (req.body.notificationSettings !== undefined) {
      profile.notificationSettings = req.body.notificationSettings;
    }
    if (req.body.savedAddresses !== undefined) {
      profile.savedAddresses = req.body.savedAddresses;
    }

    // Step 5: Recalculate profile completion
    profile.profileCompletion = calculateProfileCompletion(profile);

    // Step 6: Save profile
    await profile.save();

    res.status(200).json(profile);
  } catch (err) {
    console.error('Error updating profile by email:', err);
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
  updateProfileByEmail,
  deleteProfile,
};
