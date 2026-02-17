// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roles: {
    type: [String],
    enum: ['client', 'provider', 'admin'],
    default: ['client'],
  },
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ name: 1, roles: 1 });

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

userSchema.virtual('portfolio', {
  ref: 'Portfolio',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

userSchema.virtual('profile', {
  ref: 'Profile',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

userSchema.methods.hasRole = function (role) {
  return this.roles && this.roles.includes(role);
};

userSchema.index({ name: 1 });

module.exports = mongoose.model('User', userSchema);
