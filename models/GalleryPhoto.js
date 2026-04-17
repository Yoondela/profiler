// models/GalleryPhoto.js
const mongoose = require('mongoose');

const galleryPhotoSchema = new mongoose.Schema({
  url: { type: String, required: true },

  ownerType: {
    type: String,
    enum: ['Portfolio', 'Company'],
    required: true,
  },

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'ownerType',
  },

  isPrimary: {
    type: Boolean,
    default: false,
  },

  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

galleryPhotoSchema.index({ ownerId: 1, ownerType: 1 });

module.exports = mongoose.model('GalleryPhoto', galleryPhotoSchema);
