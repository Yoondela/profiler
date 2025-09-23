const express = require('express');
const { createBooking, getBookings, getBookingById } = require('../controllers/serviceBookingController');
const router = express.Router();

router.post('/bookings', createBooking);
router.get('/bookings', getBookings);
router.post('/bookings/:id', getBookingById);


module.exports = router;
