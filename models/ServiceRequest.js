const mongoose = require('mongoose');

const serviceRequestSchema = mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: [
      'searching',
      'accepted',
      'in_progress',
      'completed',
      'cancelled',
      'expired',
    ],
    default: 'searching',
  },
  forAddress: {
    address: {
      placeId: { type: String, default: '' },
      street: { type: String, default: '' },
      suburb: { type: String, default: '' },
      city: { type: String, default: '' },
      province: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'South Africa' },
    },
    formatted: {
      type: String,
      required: true,
    },
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
  note: {
    type: String,
    default: 'None given',
  },
  amount: {
    type: Number,
    default: 0,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  pingTimeInSeconds: {
    type: Number,
    default: 60,
  },

  notifiedProviders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  acceptedAt: Date,
  completedAt: Date,
});

serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ service: 1 });
serviceRequestSchema.index({ forAddress: '2dsphere' });


module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
