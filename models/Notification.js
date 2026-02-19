// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  type: {
    type: String,
    required: true, // 'company_invite'
  },

  title: String,
  message: String,

  entityType: String, // 'CompanyInvite'
  entityId: mongoose.Schema.Types.ObjectId,

  actions: [String], // ['accept', 'reject']

  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread',
  },

  resolved: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  readAt: Date,
});

module.exports = mongoose.model('Notification', notificationSchema);
