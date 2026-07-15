const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const Party = require('../models/Party');
const Transaction = require('../models/Transaction');
const ImportBatch = require('../models/ImportBatch');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { resolveHeader } = require('../utils/headerMap');
const { buildLineKey } = require('../utils/lineKey');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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

function detectImportMode(headers) {
  const hasTransactions = !!resolveHeader(headers, 'partyName') && !!resolveHeader(headers, 'item') && !!resolveHeader(headers, 'voucherNo') && !!resolveHeader(headers, 'value');
  const hasPartyMaster = !!resolveHeader(headers, 'partyName') || !!resolveHeader(headers, 'staffName') || !!resolveHeader(headers, 'territory') || !!resolveHeader(headers, 'division');

  if (hasTransactions) return 'transactions';
  if (hasPartyMaster) return 'parties';
  return null;
}

router.post('/file', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.find((name) => name === 'Sheet1') || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rows.length) return res.status(400).json({ success: false, message: 'No rows found in file' });

  const headers = Object.keys(rows[0]);
  const mode = detectImportMode(headers);
  if (!mode) return res.status(400).json({ success: false, message: 'Could not detect whether this file is a sales ledger or party master sheet' });

  if (mode === 'transactions') {
    const required = ['partyName', 'item', 'voucherNo', 'value'];
    const missing = required.filter((key) => !resolveHeader(headers, key));
    if (missing.length) return res.status(400).json({ success: false, message: `Missing required columns: ${missing.join(', ')}` });

    const transactionDocs = [];
    const seen = new Set();

    for (const row of rows) {
      const normalized = normalizeRow(row, headers);
      const partyName = cleanValue(normalized.partyName);
      if (!partyName) continue;

      const lineKey = buildLineKey({ voucherNo: cleanValue(normalized.voucherNo), item: cleanValue(normalized.item), partyName, value: cleanValue(normalized.value) });
      if (seen.has(lineKey)) continue;
      seen.add(lineKey);

      const existing = await Transaction.findOne({ lineKey });
      if (existing) continue;

      const party = await Party.findOne({ partyName });
      const finalTerritory = cleanValue(normalized.territory) || (party?.territory || 'Unmapped');
      const finalDivision = cleanValue(normalized.division) || (party?.division || 'Unmapped');
      const finalStaff = cleanValue(normalized.staffName) || party?.staffName || 'Unmapped';

      transactionDocs.push({
        date: cleanValue(normalized.date) ? new Date(normalized.date) : null,
        month: cleanValue(normalized.month),
        year: cleanValue(normalized.year),
        partyName,
        staffName: finalStaff,
        territory: finalTerritory,
        division: finalDivision,
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

    const batch = await ImportBatch.create({ filename: req.file.originalname, rowsInserted: transactionDocs.length, rowsSkipped: rows.length - transactionDocs.length, uploadedBy: req.user._id, type: 'transactions' });

    for (const chunk of chunkArray(transactionDocs, 1000)) {
      await Transaction.insertMany(chunk.map((doc) => ({ ...doc, importBatchId: batch._id })), { ordered: false });
    }

    return res.json({ success: true, data: { mode, rowsInserted: transactionDocs.length, rowsSkipped: rows.length - transactionDocs.length, batchId: batch._id } });
  }

  const partyNameHeader = resolveHeader(headers, 'partyName');
  const staffNameHeader = resolveHeader(headers, 'staffName');
  const territoryHeader = resolveHeader(headers, 'territory');
  const divisionHeader = resolveHeader(headers, 'division');

  const records = rows
    .map((row) => ({
      partyName: cleanValue(row[partyNameHeader] || row['Party'] || row['party']),
      staffName: cleanValue(row[staffNameHeader] || row['Staff'] || row['staff']),
      territory: cleanValue(row[territoryHeader] || row['Territory'] || row['territory']),
      division: cleanValue(row[divisionHeader] || row['Division'] || row['division'])
    }))
    .filter((item) => item.partyName);

  for (const record of records) {
    await Party.findOneAndUpdate({ partyName: record.partyName }, { $set: record }, { upsert: true, new: true });
  }

  return res.json({ success: true, data: { mode, inserted: records.length } });
});

router.post('/transactions', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.find((name) => name === 'Sheet1') || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rows.length) return res.status(400).json({ success: false, message: 'No rows found in file' });

  const headers = Object.keys(rows[0]);
  const required = ['partyName', 'item', 'voucherNo', 'value'];
  const missing = required.filter((key) => !resolveHeader(headers, key));
  if (missing.length) return res.status(400).json({ success: false, message: `Missing required columns: ${missing.join(', ')}` });

  const partyDocs = [];
  const transactionDocs = [];
  const seen = new Set();

  for (const row of rows) {
    const normalized = normalizeRow(row, headers);
    const partyName = cleanValue(normalized.partyName);
    if (!partyName) continue;

    const lineKey = buildLineKey({ voucherNo: cleanValue(normalized.voucherNo), item: cleanValue(normalized.item), partyName, value: cleanValue(normalized.value) });
    if (seen.has(lineKey)) continue;
    seen.add(lineKey);

    const existing = await Transaction.findOne({ lineKey });
    if (existing) {
      continue;
    }

    const party = await Party.findOne({ partyName });
    const finalTerritory = cleanValue(normalized.territory) || (party?.territory || 'Unmapped');
    const finalDivision = cleanValue(normalized.division) || (party?.division || 'Unmapped');
    const finalStaff = cleanValue(normalized.staffName) || party?.staffName || 'Unmapped';

    transactionDocs.push({
      date: cleanValue(normalized.date) ? new Date(normalized.date) : null,
      month: cleanValue(normalized.month),
      year: cleanValue(normalized.year),
      partyName,
      staffName: finalStaff,
      territory: finalTerritory,
      division: finalDivision,
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
    partyDocs.push({ partyName, staffName: finalStaff, territory: finalTerritory, division: finalDivision });
  }

  const batch = await ImportBatch.create({ filename: req.file.originalname, rowsInserted: transactionDocs.length, rowsSkipped: rows.length - transactionDocs.length, uploadedBy: req.user._id, type: 'transactions' });

  for (const chunk of chunkArray(transactionDocs, 1000)) {
    await Transaction.insertMany(chunk.map((doc) => ({ ...doc, importBatchId: batch._id })), { ordered: false });
  }

  res.json({ success: true, data: { rowsInserted: transactionDocs.length, rowsSkipped: rows.length - transactionDocs.length, batchId: batch._id } });
});

router.post('/parties', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const records = rows.map((row) => ({ partyName: row.Party || row['Party'], staffName: row.Staff || row['Staff'], territory: row.Territory || row['Territory'], division: row.Division || row['Division'] })).filter((item) => item.partyName);
  for (const record of records) {
    await Party.findOneAndUpdate({ partyName: record.partyName }, { $set: record }, { upsert: true, new: true });
  }
  res.json({ success: true, data: { inserted: records.length } });
});

router.get('/batches', requireAuth, requireAdmin, async (req, res) => {
  const batches = await ImportBatch.find().sort({ createdAt: -1 });
  res.json({ success: true, data: batches });
});

router.delete('/batch/:id', requireAuth, requireAdmin, async (req, res) => {
  const batch = await ImportBatch.findById(req.params.id);
  if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
  await Transaction.deleteMany({ importBatchId: batch._id });
  await ImportBatch.deleteOne({ _id: batch._id });
  res.json({ success: true, data: { deleted: true } });
});

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
}

module.exports = router;
