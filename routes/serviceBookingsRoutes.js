const express = require('express');
const {
  createBooking,
  getAllServiceBookings,
  getBookingById,
  getBookingsByUserId,
  getUpcomingBookingsByUser,
  getPastBookingsByUser,
  updateBookingStatus,
  updateBooking,
} = require('../controllers/serviceBookingController');
const router = express.Router();

router.post('/bookings', createBooking);
router.get('/bookings', getAllServiceBookings);
router.get('/bookings/:id', getBookingById);
router.get('/bookings/user/:userId', getBookingsByUserId);
router.get('/bookings/user/:userId/upcoming', getUpcomingBookingsByUser);
router.get('/bookings/user/:userId/past', getPastBookingsByUser);
router.patch('/bookings/status/:id', updateBookingStatus);
router.patch('/bookings/:id', updateBooking);


module.exports = router;
