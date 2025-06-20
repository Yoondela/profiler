const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const User = require('./models/User');
const Profile = require('./models/Profile');

dotenv.config();

const NUM_USERS = 10;

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('✅ Connected to MongoDB for seeding');

    await User.deleteMany();
    await Profile.deleteMany();

    const users = [];

    for (let i = 0; i < NUM_USERS; i++) {
      const user = new User({
        name: faker.person.fullName(),
        email: faker.internet.email(),
      });
      await user.save();

      const profile = new Profile({
        user: user._id,
        bio: faker.person.jobTitle(),
        phone: faker.string.numeric(10), // ✅ always 10 digits, numbers only
      });
      await profile.save();

      users.push({ user, profile });
    }

    console.log(`✅ Seeded ${NUM_USERS} users and profiles`);
    process.exit();
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
};

seed();
