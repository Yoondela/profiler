const mongoose = require('mongoose');
const Profile = require('./Profile'); // 🔁 Import Profile model

const userSchema = new mongoose.Schema(
  {
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
  },
  {
    discriminatorKey: 'role', // tells Mongoose which model type this is
    collection: 'users',      // all stored in one collection
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
