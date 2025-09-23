const ServiceBooking = require('../models/ServiceBooking');

const createBooking = async (req, res) => {
  try {
    const {
      client,
      provider,
      serviceType,
      description,
      forDate,
      forAddress,
      note
    } = req.body;

    // create and save booking
    const booking = new ServiceBooking({
      client,
      provider,
      serviceType,
      description,
      forDate,
      forAddress,
      note
    });

    await booking.save();

    res.status(201).json(booking);
  } catch (err) {
    console.error('Create booking error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { createBooking, getBookings, getBookingById };
