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

const getAllServiceBookings = async (req, res) => {
  try {
    const bookings = await ServiceBooking.find();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getBookingsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await ServiceBooking.find({
      $or: [
        { client: userId },
        { provider: userId }
      ]
    })
      .populate('client', 'name email')
      .populate('provider', 'name email');

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this user' });
    }

    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { 
    createBooking, 
    getAllServiceBookings,
    getBookingsByUserId,
    getBookingById,
   };
