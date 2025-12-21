// controllers/providerSearchController.js

const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');
const Category = require('../models/Category');

exports.searchProviders = async (req, res) => {
  console.log('Searching providers..');
  console.log(req.query);
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(200).json([]);

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

    const providerIds = [
      ...matchedUsers.map((u) => u._id.toString()),
      ...matchedPortfolios.map((p) => p.user.toString()),
    ];

    const uniqueIds = [...new Set(providerIds)];

    const results = await Promise.all(
      uniqueIds.map(async (id) => {
        const user = await User.findById(id);
        if (!user) return null;

        const profile = await Profile.findOne({ user: id });
        const portfolio = await Portfolio.findOne({ user: id });

        let location = null;

        if (
          portfolio?.location?.coordinates &&
          portfolio.location.coordinates.length === 2
        ) {
          location = {
            lat: portfolio.location.coordinates[1],
            lng: portfolio.location.coordinates[0],
          };
        }

        return {
          _id: user._id,
          name: user.name,
          company: portfolio?.company || '',
          location,
          servicesOffered: portfolio?.servicesOffered || [],
          avatarUrl: profile?.avatarUrl || null,
          logoUrl: portfolio?.logoUrl || null,
        };
      }),
    );

    console.log('Sucsessful!');
    return res.status(200).json(results.filter(Boolean));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.autocomplete = async (req, res) => {
  console.log('Autocomplete search..');
  console.log(req.query);

  try {
    const q = (req.query.q || '').trim();
    const isTestEnv = process.env.NODE_ENV === 'test';

    if (q.length < 2) {
      return res.status(200).json([]);
    }

    // ---------------- Categories ----------------
    let categories = [];

    if (isTestEnv) {
      categories = await Category.find({
        name: { $regex: `^${q}`, $options: 'i' },
      })
        .limit(5)
        .select({ name: 1, _id: 0 })
        .lean();

      categories = categories.map((c) => ({ label: c.name }));
    } else {
      categories = await Category.aggregate([
        {
          $search: {
            index: 'category_autocomplete',
            autocomplete: {
              query: q,
              path: 'name',
            },
          },
        },
        { $limit: 5 },
        {
          $project: {
            label: '$name',
            _id: 0,
          },
        },
      ]);
    }

    console.log('Categories found:', categories);

    // ---------------- Companies ----------------
    let companies = [];

    if (isTestEnv) {
      companies = await Portfolio.find({
        company: { $regex: `^${q}`, $options: 'i' },
      })
        .limit(5)
        .select({ company: 1, _id: 0 })
        .lean();

      companies = companies.map((c) => ({ label: c.company }));
    } else {
      companies = await Portfolio.aggregate([
        {
          $search: {
            index: 'portfolio_autocomplete',
            autocomplete: {
              query: q,
              path: 'company',
            },
          },
        },
        { $limit: 5 },
        {
          $project: {
            label: '$company',
            _id: 0,
          },
        },
      ]);
    }

    console.log('Companies found:', companies);

    // ---------------- Services ----------------
    let services = [];

    if (isTestEnv) {
      const portfolios = await Portfolio.find({
        servicesOffered: { $regex: `^${q}`, $options: 'i' },
      })
        .limit(5)
        .select({ servicesOffered: 1, _id: 0 })
        .lean();

      services = portfolios.flatMap((p) =>
        p.servicesOffered
          .filter((s) => s.toLowerCase().startsWith(q.toLowerCase()))
          .map((s) => ({ label: s })),
      );
    } else {
      services = await Portfolio.aggregate([
        {
          $search: {
            index: 'portfolio_autocomplete',
            autocomplete: {
              query: q,
              path: 'servicesOffered',
            },
          },
        },
        { $limit: 5 },
        { $unwind: '$servicesOffered' },
        {
          $project: {
            label: '$servicesOffered',
            _id: 0,
          },
        },
      ]);
    }

    console.log('Services found:', services);

    // ---------------- Merge + Deduplicate ----------------
    const results = [
      ...categories.map((c) => ({ type: 'category', label: c.label })),
      ...companies.map((c) => ({ type: 'provider', label: c.label })),
      ...services.map((s) => ({ type: 'service', label: s.label })),
    ];

    const unique = Array.from(
      new Map(results.map((i) => [i.label.toLowerCase(), i])).values(),
    );

    console.log('Autocomplete successful:', unique);

    return res.status(200).json(unique);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
