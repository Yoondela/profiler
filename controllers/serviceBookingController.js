const ServiceBooking = require('../models/ServiceBooking');
const Service = require('../models/Service');
const User = require('../models/User');
const slugify = require('slugify');
const { geocodeAddress } = require('../helper/geocodeAddress');
const matchingService = require('../services/matchingService');
const { parseGoogleAddress } = require('../helper/parseGoogleAddress');

const socket = require('../socket');
const ensureDM = require('../infra/flack/flackClient').ensureDM;

const bookingPopulate = [
  {
    path: 'client',
    select: 'name email',
    populate:{
      path: 'profile',
      model: 'Profile',
    },
  },
  {
    path: 'provider',
    select: 'name email',
    populate: {
      path: 'profile',
      model: 'Profile',
    },
  },
  { path: 'service', select: 'name slug' },
];

const createBooking = async (req, res) => {
  console.log('Creating abooking');

  try {
    const { sub: auth0Id } = req.auth?.payload || {};
    let currentUser = null;

    if (auth0Id) {
      currentUser = await User.findOne({ auth0Id });
    }

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

    console.log('forAddress is_____', forAddress);


    if (!forAddress || !forAddress.addressComponents) {
      return res.status(400).json({ message: 'Valid address required' });
    }

    // 1. Normalize
    const parsed = parseGoogleAddress({
      formatted_address: forAddress.address,
      place_id: forAddress.placeId,
      address_components: forAddress.addressComponents,
    });

    // 2. Geocode ONCE
    const { lng, lat } = await geocodeAddress(forAddress.address);

    // 3. Build final object (single source of truth)
    const finalAddress = {
      ...parsed,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    };

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
      forAddress: finalAddress,
      note,
    });

    await booking.save();

    const populated = await ServiceBooking.findById(booking._id)
      .populate(bookingPopulate);

    const fallbackUser = currentUser || (client ? await User.findById(client) : null);
    const matchingProviders = await matchingService.findTopProviders(
      fallbackUser?._id,
      populated || {},
    );
    const providerIds = matchingProviders.map((p) => p.providerId);

    await ServiceBooking.findByIdAndUpdate(booking._id, {
      notifiedProviders: providerIds,
    });

    if (fallbackUser?._id) {
      socket.emitToUser(fallbackUser._id, 'service_booking_created', populated);
    }

    matchingProviders.forEach(({ providerId }) => {
      socket.emitToUser(providerId, 'new_service_booking', populated);
    });

    console.log('Booking created:', populated || booking);

    res.status(201).json(populated || booking);

  } catch (err) {
    console.error('Create booking error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

module.exports = { createBooking };


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
    const { bookingId } = req.params;
    const { status, providerId } = req.body;
    const { sub: auth0Id } = req.auth.payload;

    if (!auth0Id) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    const user = await User.findOne({ auth0Id });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const updates = { status };

    if (status === 'accepted' && providerId) {
      updates.provider = providerId;
    }

    const booking = await ServiceBooking.findByIdAndUpdate(
      {
        _id: bookingId,
        status: 'searching',
        provider: null,
      },
      {
        status: 'accepted',
        provider: user._id,
        acceptedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate(bookingPopulate)
      .populate('notifiedProviders');


    console.log('Thus us the new booking:', booking);

    if (!booking) {
      return res.status(409).json({ message: 'Booking already accepted' });
    }

    if (booking.client.toString() === user._id.toString()) {
      return res.status(403).json({
        message: 'You cannot accept your own request',
      });
    }

    socket.emitToUser(booking.client._id, 'booking_accepted', {
      booking,
    });
    if (booking.provider?._id) {
      socket.emitToUser(booking.provider._id, 'booking_awarded', {
        booking,
      });
    }
    booking.notifiedProviders?.forEach((provider) => {
      if (provider?._id && booking.provider?._id
        && provider._id.toString() !== booking.provider._id.toString()) {
        socket.emitToUser(provider._id, 'booking_taken', {
          bookingId: booking._id,
          provider: booking.provider._id,
        });
      }
    });
    const providerUser = booking.provider?._id
      ? await User.findById(booking.provider._id)
      : null;
    const clientUser = booking.client?._id
      ? await User.findById(booking.client._id)
      : null;
    if (providerUser?.flackUserId && clientUser?.flackUserId) {
      await ensureDM(providerUser.flackUserId, clientUser.flackUserId);
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

    console.log('booking found', booking);

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


// GET searching bookings
const getPendingBookings = async (req, res) => {
  console.log('Fetching pending bookings');

  try {
    const bookings = await ServiceBooking.find({ status: 'searching' })
      .populate(bookingPopulate);

    console.log('searching pending found:', bookings.length);

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
