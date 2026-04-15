const mongoose = require('mongoose');

const searchDocumentSchema = new mongoose.Schema({

  type: {
    type: String,
    enum: ['provider', 'company', 'service', 'user'],
    required: true,
  },

  refId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  label: {
    type: String,
    required: true,
  },

});

module.exports = mongoose.model('SearchDocument', searchDocumentSchema);
