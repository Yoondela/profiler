// models/Portfolio.js
const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  displayName: {
    type: String,
    trim: true,
  },
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
  servicesOffered: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
  ],

  otherSkills: { type: [String], default: [] },
  logoUrl: { type: String, default: null },
  bannerUrl: { type: String, default: null },
  about: { type: String, default: '' },
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
    formatted: {
      type: String,
      required: true,
    },

    placeId: String,

    addressComponents: {
      street: String,
      suburb: String,
      city: String,
      province: String,
      postalCode: String,
      country: String,
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
  },
  bio: { type: String, default: '' },
  online: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  becameProviderAt: { type: Date, default: null },
});

portfolioSchema.index({ company: 1 });
portfolioSchema.index({ servicesOffered: 1 });

portfolioSchema.index({ 'address.location': '2dsphere' });

portfolioSchema.pre('save', async function (next) {
  try {
    if (!this.displayName && this.user) {
      const User = mongoose.model('User');

      const user = await User.findById(this.user).select('name');

      if (user) {
        this.displayName = user.name;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

portfolioSchema.pre('save', async function (next) {

  if (!this.displayName) return next();

  const SearchDocument = require('./SearchDocument');

  await SearchDocument.updateOne(
    { refId: this._id, type: 'provider' },
    {
      label: this.displayName,
      type: 'provider',
      refId: this._id,
    },
    { upsert: true },
  );

  next();
});



module.exports = mongoose.model('Portfolio', portfolioSchema);
