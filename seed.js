// seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const User = require('./models/User');
const Profile = require('./models/Profile');
const Portfolio = require('./models/Portfolio');
const ServiceBooking = require('./models/ServiceBooking');

dotenv.config();

const NUM_USERS = 10;
const NUM_BOOKINGS = 20;
const OWNER_EMAIL = 'yondela08@gmail.com';
const services = ['Plumbing', 'Cleaning', 'Gardening', 'Tiling', 'Car Wash', 'Other'];

// Cape Town Bounding Box (Approximate)
const CAPE_TOWN_BOUNDS = {
  latMin: -34.13,
  latMax: -33.85,
  lngMin: 18.35,
  lngMax: 18.65,
};

const suburbs = ['Sea Point', 'Claremont', 'Bellville', 'Wynberg', 'Milnerton', 'Gardens', 'Hout Bay'];


// ----------------- Helper -----------------

const makePhone = () => {
  const base = faker.string.numeric(9); // 9 digits after country code
  return `+27${base}`; // e.g. +27821234567
};

const makePortfolio = (user) => {

  // Generate random coordinates within Cape Town
  const lat = faker.number.float({ min: CAPE_TOWN_BOUNDS.latMin, max: CAPE_TOWN_BOUNDS.latMax, precision: 0.000001 });
  const lng = faker.number.float({ min: CAPE_TOWN_BOUNDS.lngMin, max: CAPE_TOWN_BOUNDS.lngMax, precision: 0.000001 });

  const suburb = faker.helpers.arrayElement(suburbs);
  const street = faker.location.streetAddress();

  return new Portfolio({
    user: user._id,
    company: faker.company.name(),
    servicesOffered: faker.helpers.arrayElements(services, faker.number.int({ min: 1, max: 3 })),
    logoUrl: faker.image.urlPicsumPhotos(),
    bannerUrl: faker.image.urlPicsumPhotos(),
    galleryPhotos: Array.from({ length: 3 }, () => ({ url: faker.image.urlPicsumPhotos() })),
    email: user.email,
    phone: makePhone(),
    address: {
      formatted: `${street}, ${suburb}, Cape Town, 8001, South Africa`,
      street: street,
      suburb: suburb,
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      country: 'South Africa',
    },

    // GeoJSON Location
    location: {
      type: 'Point',
      coordinates: [lng, lat], // Note: MongoDB uses [Longitude, Latitude]
    },
    bio: faker.person.jobDescriptor(),
    rating: faker.number.float({ min: 2, max: 5, precision: 0.1 }),
    completedJobs: faker.number.int({ min: 0, max: 100 }),
    becameProviderAt: faker.date.past({ years: 2 }),
  });
};

const makeBooking = (client, provider) => {
  const serviceType = faker.helpers.arrayElement(services);
  const date = faker.date.soon({ days: 30 });
  return new ServiceBooking({
    client: client._id,
    provider: provider._id,
    serviceType,
    description: faker.lorem.sentence(),
    status: faker.helpers.arrayElement(['pending', 'accepted', 'completed']),
    bookedAt: faker.date.recent({ days: 15 }),
    forDate: date,
    forTime: faker.helpers.arrayElement(['08:00', '10:00', '13:00', '16:00']),
    forAddress: faker.location.streetAddress(),
    note: faker.lorem.words(5),
    amount: faker.number.int({ min: 150, max: 1500 }),
  });
};

// ----------------- Main Seed Function -----------------
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    await Promise.all([
      User.deleteMany(),
      Profile.deleteMany(),
      Portfolio.deleteMany(),
      ServiceBooking.deleteMany(),
    ]);

    const users = [];
    const providers = [];
    const clients = [];

    // ---------- Seed Fake Users ----------
    for (let i = 0; i < NUM_USERS; i++) {
      const isProvider = faker.datatype.boolean();

      const user = new User({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        roles: isProvider ? ['provider'] : ['client'],
      });
      await user.save();

      const profile = new Profile({
        user: user._id,
        bio: faker.person.jobTitle(),
        phone: makePhone(),
      });
      await profile.save();

      if (isProvider) {
        const portfolio = makePortfolio(user);
        await portfolio.save();
        providers.push(user);
      } else {
        clients.push(user);
      }

      users.push({ user, profile });
    }

    console.log(`✅ Seeded ${NUM_USERS} fake users`);

    // ---------- Ensure Real Owner ----------
    let me = await User.findOne({ email: OWNER_EMAIL });
    if (!me) {
      me = await User.create({
        name: 'Yondela Hlongwane',
        email: OWNER_EMAIL,
        roles: ['provider', 'admin'],
      });

      await Profile.create({
        user: me._id,
        bio: 'Founder of the platform',
        phone: makePhone(),
        address: 'Cape Town, South Africa',
      });

      // Inside the seed function for the owner:
      await Portfolio.create({
        user: me._id,
        company: 'My Startup',
        servicesOffered: ['Cleaning', 'Gardening'],
        email: OWNER_EMAIL,
        phone: makePhone(),
        address: {
          formatted: 'Cape Town, South Africa',
          city: 'Cape Town',
          country: 'South Africa',
        },
        location: {
          type: 'Point',
          coordinates: [18.4233, -33.9249], // Cape Town City Center
        },
        rating: 5,
        completedJobs: 42,
        becameProviderAt: new Date('2023-01-01'),
      });


      providers.push(me);
      console.log('✅ Created real owner account');
    } else {
      console.log('ℹ️ Real owner already exists');
      providers.push(me);
    }

    // ---------- Seed Service Bookings ----------
    const bookings = [];
    for (let i = 0; i < NUM_BOOKINGS; i++) {
      const client = faker.helpers.arrayElement(clients);
      const provider = faker.helpers.arrayElement(providers);
      if (!client || !provider) continue;
      const booking = makeBooking(client, provider);
      await booking.save();
      bookings.push(booking);
    }

    console.log(`✅ Seeded ${NUM_BOOKINGS} service bookings`);
    console.log('🎉 Seeding complete');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
};

// ----------------- Run -----------------
seed();
