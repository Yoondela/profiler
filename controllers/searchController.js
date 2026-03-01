// controllers/providerSearchController.js

const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');
const Category = require('../models/Category');
const Company = require('../models/Company');
const Service = require('../models/Service');
const SearchDocument = require('../models/SearchDocument');


exports.searchProviders = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 20);

    if (!q) {
      return res.status(200).json({
        data: [],
        page,
        limit,
        total: 0,
        totalPages: 0,
      });
    }

    const regex = new RegExp(q, 'i');

    const matchedServices = await Service.find({
      name: regex,
    }).select('_id');

    const matchedPortfolios = await Portfolio.find({
      servicesOffered: { $in: matchedServices.map(s => s._id) },
    }).select('user');


    const searchCompanies = await Company.find({
      name: regex,
    }).select('_id');

    const matchedCompany = await Portfolio.find({
      company: { $in: searchCompanies.map(c => c._id) },
    }).select('user');

    const matchedUsers = await User.find({
      roles: 'provider',
      name: regex,
    }).select('_id');

    const providerIds = [
      ...matchedUsers.map((u) => u._id.toString()),
      ...matchedPortfolios.map((p) => p.user.toString()),
      ...matchedCompany.map((c) => c.user.toString()),
    ];

    const uniqueIds = [...new Set(providerIds)];

    const total = uniqueIds.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const paginatedIds = uniqueIds.slice(skip, skip + limit);

    const users = await User.find({ _id: { $in: paginatedIds } }).lean();
    const profiles = await Profile.find({ user: { $in: paginatedIds } }).lean();
    const portfolios = await Portfolio.find({ user: { $in: paginatedIds } })
      .populate('company', 'name logoUrl')
      .lean();

    const data = users.map((user) => {
      const profile = profiles.find(
        (p) => p.user.toString() === user._id.toString(),
      );
      const portfolio = portfolios.find(
        (p) => p.user.toString() === user._id.toString(),
      );

      let location = null;
      if (
        portfolio?.location?.coordinates?.length === 2
      ) {
        location = {
          lat: portfolio.location.coordinates[1],
          lng: portfolio.location.coordinates[0],
        };
      }

      return {
        _id: user._id,
        name: user.name,
        company: portfolio?.company?.name || '',
        servicesOffered: portfolio?.servicesOffered || [],
        avatarUrl: profile?.avatarUrl || null,
        logoUrl: portfolio?.logoUrl || null,
        location,
      };
    });

    return res.status(200).json({
      data,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.autocomplete = async (req, res) => {

  try {

    const q = (req.query.q || '').trim();

    if (q.length < 2) {
      return res.json([]);
    }

    if (process.env.NODE_ENV === 'test') {

      const regex = new RegExp(q, 'i');

      console.log('Autocomplete query (test mode):', q);

      const results = await SearchDocument
        .find({ label: regex })
        .limit(10);

      console.log('Autocomplete results (test mode):', results);

      return res.json(results);

    }

    const results = await SearchDocument.aggregate([

      {
        $search: {
          index: 'search_autocomplete',
          compound: {
            should: [
              {
                text: {
                  query: q,
                  path: 'label',
                  score: { boost: { value: 10 } },
                },
              },
              {
                autocomplete: {
                  query: q,
                  path: 'label',
                  tokenOrder: 'sequential',
                  score: { boost: { value: 5 } },
                },
              },
              {
                autocomplete: {
                  query: q,
                  path: 'label',
                  tokenOrder: 'any',
                  score: { boost: { value: 2 } },
                },
              },
            ],
          },
        },
      },

      {
        $project: {
          label: 1,
          type: 1,
          refId: 1,
          score: { $meta: 'searchScore' },
        },
      },

      { $sort: { score: -1 } },

      { $limit: 10 },

    ]);

    console.log('Autocomplete results:', results);

    res.json(results);

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: 'Server error' });

  }

};

