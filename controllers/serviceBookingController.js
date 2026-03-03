const ServiceBooking = require('../models/ServiceBooking');
const Service = require('../models/Service');
const slugify = require('slugify');
const { geocodeAddress } = require('../helper/geocodeAddress');

const createBooking = async (req, res) => {
  console.log('Creating abooking');

  try {
    const {
      client,
      provider,
      service, // now service name
      description,
      forDate,
      forTime,
      forAddress,
      note,
    } = req.body;

    let geocodedAddress;
    // Geocode once
    if (forAddress.address?.formatted && !forAddress.location?.coordinates) {
      const { lng, lat } = await geocodeAddress(forAddress.address.formatted);

      geocodedAddress = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }

    console.log('Create booking request body:', req.body);

    const slug = slugify(service, { lower: true });

    console.log('Booking service slug:', slug);

    let serviceDoc = await Service.findOne({ slug });

    if (!serviceDoc) {
      serviceDoc = await Service.create({
        name: service,
        slug,
      });
    }

    const booking = new ServiceBooking({
      client,
      provider,
      service: serviceDoc._id,
      description,
      forDate,
      forTime,
      forAddress: geocodedAddress || forAddress,
      note,
    });

    await booking.save();

    console.log('Booking created:', booking);

    res.status(201).json(booking);

  } catch (err) {
    console.error('Create booking error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

module.exports = { createBooking };


// reusable populate config
const bookingPopulate = [
  { path: 'service', select: 'name slug' },
  { path: 'client', select: 'name email' },
  { path: 'provider', select: 'name email' },
];


// GET all bookings
const getAllServiceBookings = async (req, res) => {
  console.log('Fetching all bookings');

  try {
    const bookings = await ServiceBooking.find()
      .populate(bookingPopulate)
      .sort({ requestedAt: -1 });

    res.status(200).json(bookings);
    console.log('All bookings fetched:', bookings.length);

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// GET bookings by user (client OR provider)
const getBookingsByUserId = async (req, res) => {
  console.log('Fetching bookings for user:', req.params.userId);

  try {
    const { userId } = req.params;

    const bookings = await ServiceBooking.find({
      $or: [{ client: userId }, { provider: userId }],
    })
      .populate(bookingPopulate)
      .sort({ forDate: -1 });

    if (!bookings.length) {
      return res.status(404).json({ message: 'No bookings found for this user' });
    }

    res.status(200).json(bookings);
    console.log('User bookings fetched:', bookings.length);

  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ message: err.message });
  }
};


// GET client bookings
const getClientBookings = async (req, res) => {
  console.log('Getting client bookings');

  try {
    const { clientId } = req.params;
    const { status } = req.query;

    const filter = { client: clientId };
    if (status) filter.status = status;

    const bookings = await ServiceBooking.find(filter)
      .populate([
        { path: 'service', select: 'name slug' },
        {
          path: 'client',
          select: 'name email',
          populate: { path: 'profile' },
        },
        {
          path: 'provider',
          select: 'name email',
          populate: [
            { path: 'portfolio' },
            { path: 'profile' },
          ],
        },
      ])
      .sort({ forDate: -1 });

    console.log('Client bookings fetched:', bookings.length);

    res.status(200).json(bookings);

  } catch (error) {
    console.error('Error fetching client bookings by status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// GET provider bookings
const getProviderBookings = async (req, res) => {
  console.log('Get provider bookings request params:', req.params);

  try {
    const { providerId } = req.params;
    const { status } = req.query;

    const filter = { provider: providerId };
    if (status) filter.status = status;

    const bookings = await ServiceBooking.find(filter)
      .populate(bookingPopulate)
      .sort({ forDate: -1 });

    console.log('Provider bookings fetched:', bookings.length);

    res.status(200).json(bookings);

  } catch (error) {
    console.error('Error fetching provider bookings by status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// GET booking by ID
const getBookingById = async (req, res) => {
  console.log('Fetching booking:', req.params.id);

  try {
    const booking = await ServiceBooking.findById(req.params.id)
      .populate(bookingPopulate);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('Booking found');

    res.status(200).json(booking);

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// GET upcoming bookings
const getUpcomingBookingsByUser = async (req, res) => {
  console.log('Fetching upcoming bookings for user:', req.params.userId);

  try {
    const { userId } = req.params;

    const bookings = await ServiceBooking.find({
      $or: [{ client: userId }, { provider: userId }],
      forDate: { $gte: new Date() },
    })
      .populate(bookingPopulate)
      .sort({ forDate: 1 });

    res.status(200).json(bookings);
    console.log('Upcoming bookings fetched:', bookings.length);

  } catch (err) {
    console.error('Error fetching upcoming bookings:', err);
    res.status(500).json({ message: err.message });
  }
};


// GET past bookings
const getPastBookingsByUser = async (req, res) => {
  console.log('Fetching past bookings for user:', req.params.userId);

  try {
    const { userId } = req.params;

    const bookings = await ServiceBooking.find({
      $or: [{ client: userId }, { provider: userId }],
      forDate: { $lt: new Date() },
    })
      .populate(bookingPopulate)
      .sort({ forDate: -1 });

    res.status(200).json(bookings);
    console.log('Past bookings fetched:', bookings.length);

  } catch (err) {
    console.error('Error fetching past bookings:', err);
    res.status(500).json({ message: err.message });
  }
};


// UPDATE booking status
const updateBookingStatus = async (req, res) => {
  console.log('Update booking request params:', req.params);
  console.log('Update booking request body:', req.body);

  try {
    const { id } = req.params;
    const { status, providerId } = req.body;

    const updates = { status };

    if (status === 'accepted' && providerId) {
      updates.provider = providerId;
    }

    const booking = await ServiceBooking.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate(bookingPopulate);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('Booking status updated:', booking._id);

    res.status(200).json(booking);

  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(400).json({ message: err.message });
  }
};


// UPDATE booking fields
const updateBooking = async (req, res) => {
  console.log('Updating booking:', req.params.id);

  try {
    const { id } = req.params;

    const allowedUpdates = [
      'description',
      'note',
      'forDate',
      'forTime',
      'forAddress',
      'service',
      'status',
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
    }).populate(bookingPopulate);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('Booking updated:', booking._id);

    res.status(200).json(booking);

  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(400).json({ message: err.message });
  }
};


// GET pending bookings
const getPendingBookings = async (req, res) => {
  console.log('Fetching pending bookings');

  try {
    const bookings = await ServiceBooking.find({ status: 'pending' })
      .populate(bookingPopulate);

    console.log('Pending bookings found:', bookings.length);

    res.status(200).json(bookings);

  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({ message: 'Server error fetching pending bookings' });
  }
};


// GET accepted bookings for client
const getAcceptedBookingsForClient = async (req, res) => {
  console.log('Fetching accepted bookings for client');

  try {
    const { userId } = req.params;

    const bookings = await ServiceBooking.find({
      client: userId,
      status: 'accepted',
    })
      .populate(bookingPopulate);

    console.log('Accepted bookings fetched:', bookings.length);

    res.status(200).json(bookings);

  } catch (error) {
    console.error('Error fetching accepted bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// GET bookings by status
const getBookingsByStatus = async (req, res) => {
  console.log('Getting bookings by status:', req.query.status);

  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const bookings = await ServiceBooking.find(filter)
      .populate(bookingPopulate)
      .sort({ requestedAt: -1 });

    console.log('Bookings fetched:', bookings.length);

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
