const express = require('express');
const checkJwt = require('../middleware/auth');
const {
  createBooking,
  getAllServiceBookings,
  getBookingById,
  getBookingsByUserId,
  getClientBookings,
  getProviderBookings,
  getUpcomingBookingsByUser,
  getPastBookingsByUser,
  getPendingBookings,
  getBookingsByStatus,
  updateBookingStatus,
  updateBooking,
} = require('../controllers/serviceBookingController');
const router = express.Router();

router.post('/bookings', checkJwt, createBooking);
router.get('/bookings', checkJwt, getAllServiceBookings);
router.get('/bookings/pending', checkJwt, getPendingBookings);
router.get('/bookings/client/:clientId', checkJwt, getClientBookings);
router.get('/bookings/provider/:providerId', checkJwt, getProviderBookings);
router.get('/bookings/:id', checkJwt, getBookingById);
router.get('/bookings/user/:userId', checkJwt, getBookingsByUserId);
router.get('/bookings/user/:userId/upcoming', checkJwt, getUpcomingBookingsByUser);
router.get('/bookings/user/:userId/past', checkJwt, getPastBookingsByUser);
router.patch('/bookings/status/:id', checkJwt, updateBookingStatus);
router.patch('/bookings/:id', checkJwt, updateBooking);

module.exports = router;
