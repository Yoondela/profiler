const ServiceRequest = require('../models/ServiceRequest');

const requestPopulate = [
  { path: 'client', select: 'name email' },
  { path: 'provider', select: 'name email' },
];

const createServiceRequest = async (req, res) => {
  try {
    const {
      client,
      provider,
      serviceType,
      description,
      forAddress,
      note,
      amount,
    } = req.body;

    const request = await ServiceRequest.create({
      client,
      provider,
      serviceType,
      description,
      forAddress,
      note,
      amount,
    });
    const populated = await ServiceRequest.findById(request._id).populate(requestPopulate);

    res.status(201).json(populated);
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
  try {
    const { status } = req.body;
    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    ).populate(requestPopulate);

    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createServiceRequest,
  getAllServiceRequests,
  getServiceRequestById,
  getServiceRequestsByUserId,
  updateServiceRequestStatus,
};
