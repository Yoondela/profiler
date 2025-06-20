const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

router.post('/', async (req, res) => {
  try {
    const profile = new Profile(req.body);
    const savedProfile = await profile.save();
    res.status(201).json(savedProfile);
  }   catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', 'name email');
    res.status(200).json(profiles);
  }   catch (err) {
    res.status(500).json({ message: err.message});
  }
});

router.get('/:id', async (req, res) => {
  try {
    const profile = await profile.findById(req.params.id).populate('user');
    if (!profile) return res.status(404).json({ message: 'Not Found' });
    res.status(200).json(profile);
  }   catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Profile.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidator: true,
    });
    res.status(200).json(updated);
  }   catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Profile.findByIdAndDelete(req.params.id);
    res.status(204).end();
  }   catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
