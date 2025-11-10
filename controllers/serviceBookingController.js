const ServiceBooking = require('../models/ServiceBooking');

const createBooking = async (req, res) => {
  console.log('Creating abooking');
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
    console.log('Booking created:', booking);
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

const getClientBookings = async (req, res) => {
  console.log('Getting client bookings');
  try {
    const { clientId } = req.params;
    const { status } = req.query;

    const filter = { client: clientId };
    if (status) filter.status = status;

    const bookings = await ServiceBooking.find(filter)
      .populate({
        path: 'client',
        select: 'name email',
        populate: { path: 'profile' },
      })
      .populate({
        path: 'provider',
        select: 'name email',
        populate: [
          { path: 'portfolio' },
          { path: 'profile' },
        ],
      });

    res.status(200).json(bookings);
    console.log('Successful!');
  } catch (error) {
    console.error('Error fetching client bookings by status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProviderBookings = async (req, res) => {

  console.log('Get provider bookings request params:');
  try {
    const { providerId } = req.params;
    const { status } = req.query;

    const filter = { provider: providerId };
    if (status) filter.status = status;

    const bookings = await ServiceBooking.find(filter)
      .populate('client', 'name email')
      .populate('provider', 'name email')
      .sort({ forDate: -1 });

    res.status(200).json(bookings);
    console.log('Provider bookings fetched:', bookings);
  } catch (error) {
    console.error('Error fetching provider bookings by status:', error);
    res.status(500).json({ message: 'Server error' });
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

// Update booking status
const updateBookingStatus = async (req, res) => {
  console.log('Update booking request params:', req.params);
  console.log('Update booking request body:', req.body);

  try {
    const { id } = req.params;
    const { status, providerId } = req.body;

    // Build updates object safely
    const updates = { status };
    if (status === 'accepted' && providerId) {
      updates.provider = providerId;
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

    console.log('Booking status updated:', booking);
    res.status(200).json(booking);
  } catch (err) {
    console.error('Error updating booking:', err.message);
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

const getPendingBookings = async (req, res) => {
  try {
    const bookings = await ServiceBooking.find({ status: 'pending' }).populate('client');
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({ message: 'Server error fetching pending bookings' });
  }
};

// controllers/bookingController.js
const getAcceptedBookingsForClient = async (req, res) => {
  console.log('hit 22');
  try {
    const { userId } = req.params;

    const bookings = await ServiceBooking.find({
      client: userId,
      status: 'accepted',
    })
      .populate('client', 'name')
      .populate('provider', 'name');

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching accepted bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBookingsByStatus = async (req, res) => {
  console.log('Getting booking by status', req.body);
  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const bookings = await ServiceBooking.find(filter)
      .populate('client', 'name')
      .populate('provider', 'name')
      .sort({ requestedAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
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
  getPendingBookings,
  getAcceptedBookingsForClient,
  getBookingsByStatus,
  getClientBookings,
  getProviderBookings,
};
