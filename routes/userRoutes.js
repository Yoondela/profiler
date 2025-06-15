const express = require('express');
const router = express.Router();
const User = require('../models/User');

// When GET request comes to /api/users → call the controller

// POST /api/users
router.post('/', async (req, res) => {

  try {
    const { name, email} = req.body;

    const user = new User({ name, email });
    const savedUser = await user.save();

    res.status(201).json(savedUser);
  }   catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  }   catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
