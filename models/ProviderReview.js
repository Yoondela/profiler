const mongoose  = require('mongoose');

const providerReviewSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  providerModel: {
    type: String,
    enum: ['Portfolio', 'Company'],
    required: true,
  },

  reviewerName: {
    type: String,
    required: true,
  },

  rating: {
    type: Number,
    min: 1,
    max: 5,
  },

  review: {
    type: String,
    maxlength: 500,
    required: true,
  },

  // 🔥 key field
  isFeatured: {
    type: Boolean,
    default: false,
  },

}, { timestamps: true });

module.exports = mongoose.model('ProviderReview', providerReviewSchema);
