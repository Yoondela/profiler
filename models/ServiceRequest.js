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
serviceRequestSchema.index({ 'forAddress.location': '2dsphere' });



module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
