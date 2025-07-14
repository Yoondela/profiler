// models/Profile.js
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  phone: {
    type: String,
    match: [/^\+?\d{10,15}$/, 'Please enter a valid phone number'],
  },
  address:{
    type: String,
    default: 'Non',
  },
  bio: {
    type: String,
    maxlength: 300,
    defalt: '',
  },

  preferredContactMethod: {
    type: String,
    enum: ['email', 'sms', 'phone'],
    default: 'email',
  },

  notificationSettings: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },

  savedAddresses: [
    {
      label: { type: String },
      address: { type: String }, // ✅ Simplified
    },
  ],

  profileCompletion: {
    type: Number,
    default: 15,
    min: 0,
    max: 100,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Profile', profileSchema);
