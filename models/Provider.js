const mongoose = require('mongoose');
const User = require('./User');

const providerSchema = new mongoose.Schema({
  services: [{ type: String }],   // e.g. ['plumbing', 'cleaning']
  portfolio: [{ type: String }], // image URLs or file refs
});

const Provider = User.discriminator('Provider', providerSchema);
module.exports = Provider;
