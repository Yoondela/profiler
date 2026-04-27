const ProviderReview = require('../models/ProviderReview');
const User = require('../models/User');

const resolveProvider = require('../utils/resolveProvider');

exports.createProviderReview = async (req, res) => {
  console.log('Creating provider review..');
  try {

    console.log('req.body:', req.body);
    console.log('req.auth:', req.auth);
    const { sub: auth0Id } = req.auth.payload;

    const currentUser = await User.findOne({ auth0Id });

    const { comment, rating } = req.body;

    const { provider, providerModel } = await resolveProvider(currentUser._id);

    const newReview = await ProviderReview.create({
      provider,
      reviewer: currentUser._id,
      providerModel,
      rating,
      comment,
    });

    res.status(201).json(newReview);
    console.log('Successful!');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleFeatureReview = async (req, res) => {
  console.log('Toggling feature review..');
  console.log('req.body:', req.body);
  console.log('req.params:', req.params);
  try {
    const { sub: auth0Id } = req.auth.payload;
    const currentUser = await User.findOne({ auth0Id });

    const { id } = req.params;
    const { isFeatured } = req.body;

    const { provider } = await resolveProvider(currentUser._id);

    const review = await ProviderReview.findById(id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Ensure ownership
    if (review.provider.toString() !== provider.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // 🔥 enforce max 3
    if (isFeatured) {
      const count = await ProviderReview.countDocuments({
        provider,
        isFeatured: true,
      });

      if (count >= 3) {
        return res.status(400).json({
          message: 'Maximum of 3 featured reviews allowed',
        });
      }
    }

    review.isFeatured = isFeatured;
    await review.save();

    res.status(200).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;

    const reviews = await ProviderReview.find({ provider: providerId })
      .populate({
        path: 'reviewer',
        select: 'name',
        populate: {
          path: 'profile',
          select: 'avatarUrl',
        },
      })
      .sort({ isFeatured: -1, createdAt: -1 });

    const formatted = reviews.map(r => ({
      ...r.toObject(),
      reviewer: {
        _id: r.reviewer._id,
        name: r.reviewer.name,
        avatarUrl: r.reviewer.profile?.avatarUrl || null,
      },
    }));


    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

