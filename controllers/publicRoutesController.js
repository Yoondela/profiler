// controllers/providerPublicController.js
const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');

exports.getPublicProvider = async (req, res) => {
  console.log('Getting public provider profile..');

  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user || !user.roles.includes('provider')) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const profile = await Profile.findOne({ user: id });

    const portfolio = await Portfolio.findOne({ user: id })
      .populate('servicesOffered');

    const company = await Company.findOne({ owner: id })
      .populate('members')
      .populate('servicesOffered');

    if (!profile || !portfolio) {
      return res.status(404).json({ message: 'Provider profile incomplete' });
    }

    // 🔑 Core idea: company takes precedence
    const source = company || portfolio;

    console.log('Using source:', company ? 'company' : 'portfolio');

    return res.status(200).json({
      user: {
        email: user.email,
        name: user.name,
      },

      profile: {
        phone: profile.phone,
        address: profile.address,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      },

      // 🔑 Unified public-facing provider object
      provider: {
        type: company ? 'company' : 'individual',

        name: source.name || source.displayName,

        servicesOffered: source.servicesOffered,
        otherSkills: source.otherSkills,

        logoUrl: source.logoUrl,
        bannerUrl: source.bannerUrl,

        galleryPhotos: source.galleryPhotos || [],

        address: {
          city: source?.address?.addressComponents?.city,
          suburb: source?.address?.addressComponents?.suburb,
        },

        about: source.about || source.bio,

        rating: source.rating,
        completedJobs: source.completedJobs,
        becameProviderAt: source.createdAt,
      },

      // Only include company block if it exists
      ...(company && {
        company: {
          name: company.name,
          members: company.members, // ✅ required by you
        },
      }),
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
