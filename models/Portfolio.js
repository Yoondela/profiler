// models/Portfolio.js
const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: { type: String, required: true ,default: '' },
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
  address: { type: String, default: '' },
  bio: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  becameProviderAt: { type: Date, default: null },
});


module.exports = mongoose.model('Portfolio', portfolioSchema);
