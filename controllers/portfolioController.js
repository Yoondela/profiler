const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');
const Profile = require('../models/Profile');
const GalleryPhoto = require('../models/GalleryPhoto');
const ProviderReview = require('../models/ProviderReview');

const getPortfolio = async (req, res) => {
  console.log('Getting Portfolio');

  try {
    const { providerId } = req.params;

    console.log('providerId:', providerId);
    console.log('req.params:', req.params);

    const user = await User.findById(providerId);
    if (!user || !user.roles.includes('provider')) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const portfolio = await Portfolio.findOne({ user: providerId })
      .populate('servicesOffered');

    console.log(portfolio);

    const company = await Company.findOne({ owner: providerId })
      .populate('members')
      .populate('servicesOffered');

    console.log(company);

    // company takes precedence
    const source = company || portfolio;
    const ownerType = company ? 'Company' : 'Portfolio';

    // ✅ Fetch real gallery
    const galleryPhotos = await GalleryPhoto.find({
      ownerId: source._id,
      ownerType,
    })
      .sort('order')
      .select('url order isPrimary')
      .lean();


    // use aggregation SOON!!!
    const reviews = await ProviderReview.find({
      provider: source._id,
      providerModel: ownerType,
    })
      .populate({
        path: 'reviewer',
        select: 'name',
        populate: {
          path: 'profile',
          select: 'avatarUrl',
        },
      })
      .sort({ isFeatured: -1, createdAt: -1 });

    const formattedReviews = reviews.map(r => ({
      ...r.toObject(),
      reviewer: {
        _id: r.reviewer._id,
        name: r.reviewer.name,
        avatarUrl: r.reviewer.profile?.avatarUrl || null,
      },
    }));
    console.log('Successful!');

    return res.status(200).json({

      portfolio: {
        type: company ? 'company' : 'individual',

        name: source.name || source.displayName,

        id: source._id,

        servicesOffered: source.servicesOffered,
        otherSkills: source.otherSkills,

        logoUrl: source.logoUrl,
        bannerUrl: source.bannerUrl,

        // ✅ FIXED
        galleryPhotos,

        review: formattedReviews,

        address: {
          city: source?.address?.addressComponents?.city,
          suburb: source?.address?.addressComponents?.suburb,
        },

        about: source.about || source.bio,

        rating: source.rating,
        completedJobs: source.completedJobs,
        becameProviderAt: source.createdAt,
      },

      ...(company && {
        company: {
          name: company.name,
          members: company.members,
        },
      }),
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updatePortfolio = async (req, res) => {
  console.log('Updating Provider');

  try {
    const { providerId } = req.params;
    const updates = req.body;

    console.log('providerId:', providerId);
    console.log('updates:', updates);

    const portfolio = await Portfolio.findOne({ user: providerId });
    if (!portfolio) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const company = await Company.findOne({ owner: providerId });

    // 🔑 company takes precedence
    const target = company || portfolio;

    const allowedFields = [
      'displayName',
      'name',
      'servicesOffered',
      'otherSkills',
      'logoUrl',
      'bannerUrl',
      'about',
      'bio',
      'phone',
      'email',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        target[field] = updates[field];
      }
    });

    await target.save();

    console.log('Successful!');

    return res.status(200).json({
      type: company ? 'company' : 'portfolio',
      data: target,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { getPortfolio, updatePortfolio };
