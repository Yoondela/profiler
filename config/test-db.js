const mongoose = require('mongoose');

const connectTestDB = async () => {
  const uri = 'mongodb://localhost:27017/test';
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Test MongoDB connected');
  } catch (err) {
    console.error('❌ Test DB connection error:', err.message);
  }
};

module.exports = connectTestDB;
