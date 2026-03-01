// models/Service.js

const SearchDocument = require('./SearchDocument');

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  slug: {
    type: String,
    required: true,
    unique: true,
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },

});


serviceSchema.post('save', async function(doc) {

  await SearchDocument.create({
    type: 'service',
    refId: doc._id,
    label: doc.name,
  });

});


module.exports = mongoose.model('Service', serviceSchema);
