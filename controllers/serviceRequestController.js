const ServiceRequest = require('../models/ServiceRequest');
const Service = require('../models/Service');
const User = require('../models/User');
const slugify = require('slugify');
const matchingService = require('../services/matchingService');
const socket = require('../socket');

const requestPopulate = [
  { path: 'client', select: 'name email' },
  { path: 'provider', select: 'name email' },
  { path: 'service', select: 'name slug' },
];

const createServiceRequest = async (req, res) => {
  console.log('Creating service request with data:', req.body);
  console.log('auth', req.auth);
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

    const slug = slugify(service, { lower: true });

    let serviceDoc = await Service.findOne({ slug });

    if (!serviceDoc) {
      serviceDoc = await Service.create({
        name: service,
        slug,
      });
    }

    const request = await ServiceRequest.create({
      client,
      provider,
      service: serviceDoc._id,
      description,
      forAddress,
      note,
      amount,
    });
    const populated = await ServiceRequest.findById(request._id).populate(requestPopulate);

    const matchingProviders = await matchingService.findTopProviders(populated);

    const providerIds = matchingProviders.map(p => p.providerId);

    await ServiceRequest.findByIdAndUpdate(request._id, {
      notifiedProviders: providerIds,
    });


    console.log('Matching providers found:', matchingProviders);

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

    request.notifiedProviders.forEach((provider) => {
      if (provider._id.toString() !== user._id.toString()) {
        socket.emitToUser(provider._id, 'request_taken', {
          requestId: request._id,
          provider: user._id,
        });
      }
    });

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
