require('dotenv').config({ path: '.env' });

jest.mock('express-oauth2-jwt-bearer', () => ({
  auth: () => (req, res, next) => next(),
}));


beforeAll(async () => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 0) {
    const conn = await mongoose.connect(process.env.MONGO_URI_TEST, {
    });
    console.log(`MongoDB Connected for tests: ${conn.connection.host}`);
  }
});

afterAll(async () => {
  const mongoose = require('mongoose');
  await mongoose.connection.close();
});
