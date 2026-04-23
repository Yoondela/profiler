require('dotenv').config({ path: '.env' });

// jest.mock('express-oauth2-jwt-bearer');

jest.mock('express-oauth2-jwt-bearer', () => {
  return {
    auth: () => (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];

      req.auth = {
        payload: {
          sub: token || 'auth0|mock-user-id',
          scope: 'read:all write:all',
        },
      };

      next();
    },
    requiredScopes: () => (req, res, next) => next(),
  };
});


beforeAll(async () => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 0) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI_TEST, {});
      console.log(`MongoDB Connected for tests: ${conn.connection.host}`);
    } catch (err) {
      console.warn(`Skipping test DB connection: ${err.message}`);
    }
  }
});

afterAll(async () => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
