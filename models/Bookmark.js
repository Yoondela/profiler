const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      // required: true,
      refPath: 'User', // can be either company owner or portfolio user
    },

    targetType: {
      type: String,
      required: true,
      enum: ['Portfolio', 'Company'],
    },
  },
  { timestamps: true },
);

bookmarkSchema.index(
  { client: 1, targetId: 1, targetType: 1 },
  { unique: true },
);

module.exports = mongoose.model('Bookmark', bookmarkSchema);
