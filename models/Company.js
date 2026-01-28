// models/Company.js
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },

  logoUrl: { type: String, default: null },
  bannerUrl: { type: String, default: null },
  about: { type: String, default: '' },

  // Company base address (HQ / operating base)
  address: {
    formatted: { type: String, default: '' },
    placeId: { type: String, default: '' },
    street: { type: String, default: '' },
    suburb: { type: String, default: '' },
    city: { type: String, default: '' },
    province: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'South Africa' },
  },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: undefined,
    },
    coordinates: {
      type: [Number],
      default: undefined,
    },
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
  }],

  rating: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
}, { timestamps: true });

companySchema.index({ name: 1 });
companySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Company', companySchema);
