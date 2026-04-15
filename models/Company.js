// models/Company.js
const mongoose = require('mongoose');
const SearchDocument = require('./SearchDocument');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },

  logoUrl: { type: String, default: null },
  bannerUrl: { type: String, default: null },
  about: { type: String, default: '' },

  // Company base address (HQ / operating base)
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
companySchema.index({ 'address.location': '2dsphere' });

companySchema.post('save', async function(doc) {

  await SearchDocument.create({
    type: 'company',
    refId: doc._id,
    label: doc.name,
  });

});


module.exports = mongoose.model('Company', companySchema);
