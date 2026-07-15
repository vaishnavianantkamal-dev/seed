const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Party = require('./src/models/Party');
const Transaction = require('./src/models/Transaction');
const { resolveHeader } = require('./src/utils/headerMap');
const { buildLineKey } = require('./src/utils/lineKey');

function cleanValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '#REF!' || trimmed === '#N/A') return null;
    return trimmed;
  }
  return value;
}

function normalizeRow(row, headers) {
  const normalized = {};
  for (const key of ['date','month','year','partyName','staffName','territory','division','item','packingSize','itemGroup','voucherType','voucherNo','quantity','caseKg','rate','value','status']) {
    const header = resolveHeader(headers, key);
    const raw = header ? row[header] : undefined;
    normalized[key] = raw;
  }
  return normalized;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ellora_crm');
  const buf = fs.readFileSync(path.resolve(__dirname, '..', 'CR.xlsx'));
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames.find((name) => name === 'Sheet1') || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const headers = Object.keys(rows[0]);
  const transactionDocs = [];
  const seen = new Set();
  for (const row of rows.slice(0, 10)) {
    const normalized = normalizeRow(row, headers);
    const partyName = cleanValue(normalized.partyName);
    if (!partyName) continue;
    const lineKey = buildLineKey({ voucherNo: cleanValue(normalized.voucherNo), item: cleanValue(normalized.item), partyName, value: cleanValue(normalized.value) });
    if (seen.has(lineKey)) continue;
    seen.add(lineKey);
    const existing = await Transaction.findOne({ lineKey });
    if (existing) continue;
    transactionDocs.push({
      date: cleanValue(normalized.date) ? new Date(normalized.date) : null,
      month: cleanValue(normalized.month),
      year: cleanValue(normalized.year),
      partyName,
      staffName: cleanValue(normalized.staffName) || 'Unmapped',
      territory: cleanValue(normalized.territory) || 'Unmapped',
      division: cleanValue(normalized.division) || 'Unmapped',
      item: cleanValue(normalized.item),
      packingSize: Number(cleanValue(normalized.packingSize)) || null,
      itemGroup: cleanValue(normalized.itemGroup),
      voucherType: cleanValue(normalized.voucherType),
      voucherNo: cleanValue(normalized.voucherNo),
      quantity: Number(cleanValue(normalized.quantity)) || null,
      caseKg: Number(cleanValue(normalized.caseKg)) || null,
      rate: Number(cleanValue(normalized.rate)) || null,
      value: Number(cleanValue(normalized.value)) || null,
      status: cleanValue(normalized.status),
      lineKey,
      importBatchId: null
    });
  }
  console.log('transactionDocs length', transactionDocs.length);
  if (transactionDocs.length) {
    const inserted = await Transaction.insertMany(transactionDocs, { ordered: false });
    console.log('inserted count', inserted.length);
  }
  await mongoose.disconnect();
})();
