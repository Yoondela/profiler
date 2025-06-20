const mongoose = require('mongoose');
const Profile = require('./Profile'); // 🔁 Import Profile model

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 🔁 Automatically create a linked Profile after a user is saved
userSchema.post('save', async function (doc, next) {
  try {
    await Profile.create({
      user: doc._id,
      bio: 'New user',
      phone: '0000000000', // default placeholder
    });
    next();
  } catch (err) {
    console.error('Error creating profile:', err.message);
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
