const mongoose = require('mongoose');

const serviceBookingSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    required: false,
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['Plumbing', 'Cleaning', 'Gardening', 'Tiling', 'Car Wash', 'Other'],
  },
  description: {
    type: String,
    required: false,
    maxlength: 200,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'confirmed'],
    default: 'pending',
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
  forDate: {
    type: Date,
    required: true,
  },
  forTime: {
    type: String,
    required: true,
  },
  forAddress: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: 'None given',
  },
  amount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);
