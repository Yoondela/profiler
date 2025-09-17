const express = require('express');
const router = express.Router();
const ServiceBooking = require('../models/ServiceBooking');

router.post('/', async (req, res) => {
  try {
    const booking = new ServiceBooking(req.body);
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
