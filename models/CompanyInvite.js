// models/CompanyInvite.js
const mongoose = require('mongoose');

const companyInviteSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },

  portfolio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true,
  },

  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

companyInviteSchema.index({ company: 1, portfolio: 1 }, { unique: true });

module.exports = mongoose.model('CompanyInvite', companyInviteSchema);
