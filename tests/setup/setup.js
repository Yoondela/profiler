tests/setup.js;
const mongoose = require('mongoose');
require('dotenv').config();

jest.mock('express-oauth2-jwt-bearer', () => ({
  auth: () => (req, res, next) => next(),
}));


beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});
