// models/Portfolio.js
const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null,
  },
  servicesOffered: { type: [String], default: [] },
  otherSkills: { type: [String], default: [] },
  logoUrl: { type: String, default: null },
  bannerUrl: { type: String, default: null },
  galleryPhotos: {
    type: [
      {
        url: { type: String, required: true },
      },
    ],
    default: [],
  },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
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

  bio: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  becameProviderAt: { type: Date, default: null },
});

portfolioSchema.index({ company: 1 });
portfolioSchema.index({ servicesOffered: 1 });

portfolioSchema.index({ location: '2dsphere' });


module.exports = mongoose.model('Portfolio', portfolioSchema);
