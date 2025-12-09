// controllers/providerSearchController.js
const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');

exports.searchProviders = async (req, res) => {
  console.log('Search query received:', req.query);
  try {
    const q = (req.query.q || '').trim();

    if (!q) return res.status(200).json([]);

    // Search in both User + Portfolio collections
    const matchedPortfolios = await Portfolio.find({
      $or: [
        { company: new RegExp(q, 'i') },
        { servicesOffered: { $in: [new RegExp(q, 'i')] } },
      ],
    });

    const matchedUsers = await User.find({
      roles: 'provider',
      name: new RegExp(q, 'i'),
    });

    // Collect user IDs
    const providerIds = [
      ...matchedUsers.map((u) => u._id.toString()),
      ...matchedPortfolios.map((p) => p.user.toString()),
    ];

    // Remove duplicates
    const uniqueIds = [...new Set(providerIds)];

    // Resolve each provider's minimal public info
    const results = await Promise.all(
      uniqueIds.map(async (id) => {
        const user = await User.findById(id);
        const profile = await Profile.findOne({ user: id });
        const portfolio = await Portfolio.findOne({ user: id });

        return {
          _id: user._id,
          name: user.name,
          company: portfolio?.company || '',
          servicesOffered: portfolio?.servicesOffered || [],
          avatarUrl: profile?.avatarUrl || null,
        };
      }),
    );

    return res.status(200).json(results.filter(Boolean));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
