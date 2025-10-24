const ServiceBooking = require('../models/ServiceBooking');

const createBooking = async (req, res) => {
  console.log('Create booking request body:', req.body);
  try {
    const {
      client,
      provider,
      serviceType,
      description,
      forDate,
      forTime,
      forAddress,
      note,
    } = req.body;

    // create and save booking
    const booking = new ServiceBooking({
      client,
      provider,
      serviceType,
      description,
      forDate,
      forTime,
      forAddress,
      note,
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
        { provider: userId },
      ],
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

const getUpcomingBookingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await ServiceBooking.find({
      $or: [{ client: userId }, { provider: userId }],
      forDate: { $gte: new Date() }, // date now or later
    })
      .populate('client', 'name email')
      .populate('provider', 'name email')
      .sort({ forDate: 1 }); // soonest first

    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPastBookingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await ServiceBooking.find({
      $or: [{ client: userId }, { provider: userId }],
      forDate: { $lt: new Date() }, // before today
    })
      .populate('client', 'name email')
      .populate('provider', 'name email')
      .sort({ forDate: -1 }); // most recent first

    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update booking
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const booking = await ServiceBooking.findByIdAndUpdate(id, updates, {
      new: true, // return the updated doc
      runValidators: true, // enforce schema validation
    })
      .populate('client', 'name email')
      .populate('provider', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update booking (only editable fields)
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow editable fields
    const allowedUpdates = [
      'description',
      'note',
      'forDate',
      'forTime',
      'forAddress',
      'serviceType',
      'status', // keep status editable too
    ];

    const updates = {};
    for (let key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const booking = await ServiceBooking.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('client', 'name email')
      .populate('provider', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


module.exports = {
  createBooking,
  getAllServiceBookings,
  getBookingsByUserId,
  getBookingById,
  getUpcomingBookingsByUser,
  getPastBookingsByUser,
  updateBookingStatus,
  updateBooking,
};
