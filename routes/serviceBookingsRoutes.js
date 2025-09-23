const express = require('express');
const { 
    createBooking,
    getAllServiceBookings,
    getBookingById,
    getBookingsByUserId
} = require('../controllers/serviceBookingController');
const router = express.Router();

router.post('/bookings', createBooking);
router.get('/bookings', getAllServiceBookings);
router.get('/bookings/:id', getBookingById);
router.get('/bookings/user/:userId', getBookingsByUserId);



module.exports = router;
