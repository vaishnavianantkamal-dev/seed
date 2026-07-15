const mongoose = require('mongoose');

const importBatchSchema = new mongoose.Schema({
  filename: String,
  rowsInserted: Number,
  rowsSkipped: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String
}, { timestamps: true });

module.exports = mongoose.model('ImportBatch', importBatchSchema);
