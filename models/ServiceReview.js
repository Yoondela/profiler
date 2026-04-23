const mongoose  = require('mongoose');

const serviceReviewSchema = new mongoose.Schema(
  {
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
      unique: true, // one review per job
    },

    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    providerModel: {
      type: String,
      enum: ['Portfolio', 'Company'],
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    review: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true },
);


const ServiceRequest = require('./ServiceRequest.js');

serviceReviewSchema.pre('save', async function (next) {
  const sr = await ServiceRequest.findById(this.serviceRequest);

  if (!sr) return next(new Error('Service request not found'));

  if (sr.status !== 'completed') {
    return next(new Error('Cannot review incomplete service'));
  }

  next();
});

module.exports = mongoose.model('ServiceReview', serviceReviewSchema);
