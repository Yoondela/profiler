const ServiceRequest = require('../models/ServiceRequest');
const Service = require('../models/Service');
const User = require('../models/User');
const slugify = require('slugify');
const { geocodeAddress } = require('../helper/geocodeAddress');
const matchingService = require('../services/matchingService');
const { parseGoogleAddress } = require('../helper/parseGoogleAddress');

const socket = require('../socket');
const ensureDM = require('../infra/flack/flackClient').ensureDM;

const requestPopulate = [
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


const createServiceRequest = async (req, res) => {
  console.log('Creating service request with data:', req.body);
  console.log('auth', req.auth);
  const { sub: auth0Id } = req.auth.payload;


  if (!auth0Id) {
    return res.status(401).json({ message: 'Not authorised' });
  }

  const currentUser = await User.findOne({ auth0Id });

  if (!currentUser) {
    return res.status(404).json({ message: 'User not found' });
  };

  console.log('Current user:', currentUser._id);

  try {
    const {
      client,
      provider,
      service,
      description,
      forAddress,
      note,
      amount,
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

    console.log('The final Addreess: ', finalAddress);

    const slug = slugify(service, { lower: true });

    console.log('The slug: ', slug);

    let serviceDoc = await Service.findOne({ slug });

    console.log('service doc: ', serviceDoc);

    try {

      if (!serviceDoc) {
        serviceDoc = await Service.create({
          name: service,
          slug,
        });

        console.log(serviceDoc);

      }
    } catch (e) {
      console.log('err: ', e);
    }

    console.log('Creating the req');

    const request = await ServiceRequest.create({
      client,
      provider,
      service: serviceDoc._id,
      description,
      forAddress: finalAddress,
      note,
      amount,
    });

    console.log('The request: ', request);

    const populated = await ServiceRequest.findById(request._id).populate(requestPopulate);

    const matchingProviders = await matchingService.findTopProviders(currentUser._id, populated);

    const providerIds = matchingProviders.map(p => p.providerId);

    await ServiceRequest.findByIdAndUpdate(request._id, {
      notifiedProviders: providerIds,
    });


    console.log('Matching providers found:', matchingProviders);

    //emit to client
    socket.emitToUser(currentUser._id, 'service_request_created', populated);

    // Emit to top providers
    matchingProviders.forEach(({ providerId }) => {
      socket.emitToUser(providerId, 'new_service_request', populated);
    });

    res.status(201).json(populated);
    console.log('Successful!');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllServiceRequests = async (_req, res) => {
  try {
    const requests = await ServiceRequest.find()
      .populate(requestPopulate)
      .sort({ requestedAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getServiceRequestById = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id).populate(requestPopulate);

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getServiceRequestsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await ServiceRequest.find({
      $or: [{ client: userId }, { provider: userId }],
    })
      .populate(requestPopulate)
      .sort({ requestedAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateServiceRequestStatus = async (req, res) => {
  console.log('Accepting request');

  try {
    const { sub: auth0Id } = req.auth.payload;
    const { requestId } = req.params;

    if (!auth0Id) {
      return res.status(401).json({ message: 'Not authorised' });
    }

    const user = await User.findOne({ auth0Id });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const request = await ServiceRequest.findOneAndUpdate(
      {
        _id: requestId,
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
    ).populate(requestPopulate)
      .populate('notifiedProviders');

    if (!request) {
      return res.status(409).json({
        message: 'Request already accepted',
      });
    };

    if (request.client.toString() === user._id.toString()) {
      return res.status(403).json({
        message: 'You cannot accept your own request',
      });
    }

    socket.emitToUser(request.client._id, 'request_accepted', {
      request: request,
    });

    socket.emitToUser(user._id, 'request_awarded', {
      request: request,
    });

    request.notifiedProviders.forEach((provider) => {
      if (provider._id.toString() !== user._id.toString()) {
        socket.emitToUser(provider._id, 'request_taken', {
          requestId: request._id,
          provider: user._id,
        });
      }
    });

    //Flack DM setup

    const provider = await User.findById(request.provider);
    const client = await User.findById(request.client);
    const userA = provider.flackUserId;
    const userB = client.flackUserId;

    console.log('Provider Flack User ID:', provider.flackUserId);
    console.log('Client Flack User ID:', client.flackUserId);

    await ensureDM(userA, userB);

    res.status(200).json(request);
    console.log('Successful!');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createServiceRequest,
  getAllServiceRequests,
  getServiceRequestById,
  getServiceRequestsByUserId,
  updateServiceRequestStatus,
};
