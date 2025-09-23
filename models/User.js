// models/User.js
const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema({
  servicesOffered: { type: [String], default: [] },
  bio: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  becameProviderAt: { type: Date, default: null },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roles: {
    type: [String],
    enum: ['client', 'provider', 'admin'],
    default: ['client'],
  },
  providerProfile: { type: providerProfileSchema, default: null },
  createdAt: { type: Date, default: Date.now },
});

userSchema.methods.hasRole = function (role) {
  return this.roles && this.roles.includes(role);
};

module.exports = mongoose.model('User', userSchema);
