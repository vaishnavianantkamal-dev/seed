const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: Date,
  month: String,
  year: String,
  partyName: String,
  staffName: String,
  territory: String,
  division: String,
  item: String,
  packingSize: Number,
  itemGroup: String,
  voucherType: String,
  voucherNo: String,
  quantity: Number,
  caseKg: Number,
  rate: Number,
  value: Number,
  status: String,
  importBatchId: mongoose.Schema.Types.ObjectId,
  lineKey: { type: String, index: true }
}, { timestamps: true });

transactionSchema.index({ year: 1, month: 1, territory: 1, division: 1, itemGroup: 1 });
transactionSchema.index({ item: 1 });
transactionSchema.index({ partyName: 1 });
transactionSchema.index({ staffName: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ voucherType: 1 });
transactionSchema.index({ date: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
