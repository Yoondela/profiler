const ServiceReview = require('../models/ServiceReview');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const mongoose = require('mongoose');

const resolveProvider = require('../utils/resolveProvider');
const { auth } = require('express-oauth2-jwt-bearer');

exports.createServiceReview = async (req, res) => {

  console.log('Creating a review..');

  try {
    const { sub: auth0Id } = req.auth.payload;

    const { serviceRequest, rating, review } = req.body;

    const currentUser = await User.findOne({ auth0Id });

    console.log('user', currentUser);


    // 1. Get service request
    const sr = await ServiceRequest.findById(serviceRequest);

    if (!sr) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // 2. Ownership check
    if (sr.client.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // 3. Must be completed
    if (sr.status !== 'completed') {
      return res.status(400).json({ message: 'Service not completed' });
    }

    // 4. Resolve provider (🔥 company takes precedence)
    const { provider, providerModel } = await resolveProvider(sr.provider);

    // 5. Create review
    const newReview = await ServiceReview.create({
      reviewer: currentUser._id,
      provider,
      providerModel,
      serviceRequest,
      rating,
      review,
    });

    return res.status(201).json(newReview);
  } catch (err) {
    // 🔥 handle duplicate review (unique index)
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Review already exists' });
    }

    return res.status(500).json({ message: err.message });
  }
};

exports.getProviderServiceReviews = async (req, res) => {
  try {
    const { providerId } = req.params;

    const reviews = await ServiceReview.find({ provider: providerId })
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProviderStats = async (req, res) => {
  console.log('Getting provider stats for providerId:', req.params.providerId);
  try {
    const { providerId } = req.params;

    const result = await ServiceReview.aggregate([
      { $match: { provider: new mongoose.Types.ObjectId(providerId) } },
      {
        $group: {
          _id: '$provider',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json(result[0] || { avgRating: 0, count: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
