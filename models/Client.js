const mongoose = require('mongoose');
const User = require('./User');

const clientSchema = new mongoose.Schema({
  address: { type: String },
  preferences: [{ type: String }], // e.g. ['gardening', 'painting']
});

const Client = User.discriminator('Client', clientSchema);
module.exports = Client;
