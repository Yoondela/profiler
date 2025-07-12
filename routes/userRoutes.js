const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');


const authMiddleware = require('../middleware/auth');

router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This route is protected', user: req.user });
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { name, email} = req.body;

    let user = await User.findOne({ email });

    let savedUser;
    let profile;

    if (!user) {
      user = new User({ name, email });
      savedUser = await user.save();

      profile = new Profile({
        user: savedUser._id,
        bio: 'New user',
        phone: '0000000000'
      });

      await profile.save();
    }
    res.status(201).json({ newUser: savedUser, profile });
  }   catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all registered
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  }   catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
