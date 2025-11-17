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
    required: true,
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['Plumbing', 'Cleaning', 'Gardening', 'Tiling', 'Other'],
  },
  description: {
    type: String,
    required: false,
    minlength: 200,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending',
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
  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
