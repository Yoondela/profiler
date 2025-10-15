const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri;

    if (process.env.NODE_ENV !== 'test') {
      uri = process.env.MONGO_URI;
    }

    if (!uri) throw new Error('MongoDB URI not found');

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected for production: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
