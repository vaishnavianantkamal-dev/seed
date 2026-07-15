const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  partyName: { type: String, required: true, unique: true, index: true },
  staffName: String,
  territory: String,
  division: String
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema);
