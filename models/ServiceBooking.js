const mongoose = require('mongoose');

const serviceBookingSchema = mongoose.Schema({
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
    required: true,
    minlength: 10,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending',
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
  forDate: {
    type: Date,
    reqired: true,
  },
  forAdress: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: 'None given'
  }

});

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);
