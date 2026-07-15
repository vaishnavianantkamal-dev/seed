const express = require('express');
const Transaction = require('../models/Transaction');
const { requireAuth } = require('../middleware/auth');
const { ANALYTICS_FIELDS, ALLOWED_MEASURES, ALLOWED_AGGREGATIONS, ALLOWED_ROW_FIELDS, ALLOWED_COL_FIELDS } = require('../utils/allowlist');

const router = express.Router();

function buildFilterQuery(filters = {}) {
  const query = {};
  for (const field of ANALYTICS_FIELDS) {
    const values = filters[field];
    if (Array.isArray(values) && values.length > 0) {
      query[field] = { $in: values };
    }
  }

  if (filters.dateFrom || filters.dateTo) {
    query.date = {};
    if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
  }

  return query;
}

router.get('/filters', requireAuth, async (req, res) => {
  const [years, months, territories, divisions, itemGroups, items, packingSizes, voucherTypes, statuses, staff, parties] = await Promise.all([
    Transaction.distinct('year'),
    Transaction.distinct('month'),
    Transaction.distinct('territory'),
    Transaction.distinct('division'),
    Transaction.distinct('itemGroup'),
    Transaction.distinct('item'),
    Transaction.distinct('packingSize'),
    Transaction.distinct('voucherType'),
    Transaction.distinct('status'),
    Transaction.distinct('staffName'),
    Transaction.distinct('partyName')
  ]);

  res.json({ success: true, data: {
    years: years.sort(),
    months: months.sort(),
    territories: territories.sort(),
    divisions: divisions.sort(),
    itemGroups: itemGroups.sort(),
    items: items.sort(),
    packingSizes: packingSizes.sort((a, b) => Number(a) - Number(b)),
    voucherTypes: voucherTypes.sort(),
    statuses: statuses.sort(),
    staff: staff.sort(),
    parties: parties.sort()
  }});
});

router.post('/pivot', requireAuth, async (req, res) => {
  const { filters = {}, measure = 'caseKg', aggregation = 'sum', rowField = 'year', colField = null } = req.body;
  if (!ALLOWED_MEASURES.includes(measure)) throw new Error('Invalid measure');
  if (!ALLOWED_AGGREGATIONS.includes(aggregation)) throw new Error('Invalid aggregation');
  if (!ALLOWED_ROW_FIELDS.includes(rowField)) throw new Error('Invalid rowField');
  if (colField && !ALLOWED_COL_FIELDS.includes(colField)) throw new Error('Invalid colField');

  const match = buildFilterQuery(filters);
  const group = { row: `$${rowField}` };
  if (colField) group.col = `$${colField}`;

  const matchedRows = await Transaction.countDocuments(match);
  const operator = aggregation === 'count' ? { $sum: 1 } : { [`$${aggregation}`]: `$${measure}` };
  const pipeline = [
    { $match: match },
    { $group: { _id: group, total: operator } },
    { $sort: { '_id.row': 1, '_id.col': 1 } }
  ];

  const docs = await Transaction.aggregate(pipeline);
  const rowMap = new Map();
  const columns = [];

  docs.forEach((doc) => {
    const rowLabel = doc._id.row ?? 'Unknown';
    const colLabel = doc._id.col ?? 'Total';
    if (!rowMap.has(rowLabel)) rowMap.set(rowLabel, { label: rowLabel, cells: {}, total: 0 });
    const rowEntry = rowMap.get(rowLabel);
    rowEntry.cells[colLabel] = Number(doc.total.toFixed(2));
    if (colField) {
      if (!columns.includes(colLabel)) columns.push(colLabel);
    }
    rowEntry.total = Number((rowEntry.total + Number(doc.total)).toFixed(2));
  });

  const rows = Array.from(rowMap.values()).map((row) => ({ ...row, total: Number(row.total.toFixed(2)) }));
  const columnTotals = {};
  if (colField) {
    columns.forEach((col) => {
      const total = rows.reduce((sum, row) => sum + (row.cells[col] || 0), 0);
      columnTotals[col] = Number(total.toFixed(2));
    });
  }

  const grandTotal = Number(rows.reduce((sum, row) => sum + row.total, 0).toFixed(2));

  res.json({ success: true, data: { rowField, colField, measure, aggregation, columns, rows, columnTotals, grandTotal, matchedRows } });
});

router.post('/summary', requireAuth, async (req, res) => {
  const { filters = {} } = req.body;
  const match = buildFilterQuery(filters);
  const docs = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: null, totalQuantity: { $sum: '$quantity' }, totalCaseKg: { $sum: '$caseKg' }, totalValue: { $sum: '$value' }, avgRate: { $avg: '$rate' }, transactionCount: { $sum: 1 }, partyCount: { $addToSet: '$partyName' } } }
  ]);
  const result = docs[0] || {};
  res.json({ success: true, data: {
    totalQuantity: Number((result.totalQuantity || 0).toFixed(2)),
    totalCaseKg: Number((result.totalCaseKg || 0).toFixed(2)),
    totalValue: Number((result.totalValue || 0).toFixed(2)),
    avgRate: Number((result.avgRate || 0).toFixed(2)),
    transactionCount: result.transactionCount || 0,
    partyCount: result.partyCount?.length || 0
  }});
});

router.post('/transactions', requireAuth, async (req, res) => {
  const { filters = {}, page = 1, limit = 20 } = req.body;
  const match = buildFilterQuery(filters);
  const skip = (Number(page) - 1) * Number(limit);
  const [rows, total] = await Promise.all([
    Transaction.find(match).skip(skip).limit(Number(limit)).sort({ date: -1 }),
    Transaction.countDocuments(match)
  ]);
  res.json({ success: true, data: { rows, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
});

router.post('/export', requireAuth, async (req, res) => {
  const { filters = {}, measure = 'caseKg', aggregation = 'sum', rowField = 'year', colField = null } = req.body;
  const match = buildFilterQuery(filters);
  const docs = await Transaction.aggregate([{ $match: match }, { $group: { _id: { row: `$${rowField}` }, total: { [`$${aggregation}`]: `$${measure}` } } }]);
  const wb = { SheetNames: ['Pivot'], Sheets: {} };
  const data = [['Row', 'Value']];
  docs.forEach((doc) => data.push([doc._id.row, doc.total]));
  const ws = require('xlsx').utils.aoa_to_sheet(data);
  require('xlsx').utils.book_append_sheet(wb, ws, 'Pivot');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=pivot.xlsx');
  require('xlsx').write(res, wb);
});

module.exports = router;
