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

userSchema.methods.hasRole = function (role) {
  return this.roles && this.roles.includes(role);
};

module.exports = mongoose.model('User', userSchema);
