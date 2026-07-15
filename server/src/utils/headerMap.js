const HEADER_ALIASES = {
  date: ['date', 'date '],
  month: ['month', 'month '],
  year: ['year', 'year '],
  partyName: ['party name', 'partyname', 'party', 'working party name', 'working party name '],
  staffName: ['staff name', 'staffname', 'staff'],
  territory: ['territory', 'territory '],
  division: ['division', 'division '],
  item: ['item', 'item '],
  packingSize: ['packing size', 'packingsize', 'packing size '],
  itemGroup: ['item group-1', 'item group', 'itemgroup', 'item group 1'],
  voucherType: ['voucher type', 'vouchertype'],
  voucherNo: ['voucher no.', 'voucher no', 'voucherno'],
  quantity: ['quantity', 'qty'],
  caseKg: ['case / kg', 'case/kg', 'casekg', 'case / kg '],
  rate: ['rate', 'rate '],
  value: ['value', 'value '],
  status: ['status', 'status ']
};

function normalizeHeader(header) {
  return String(header || '').trim().toLowerCase();
}

function resolveHeader(headers, target) {
  const allowed = HEADER_ALIASES[target] || [target];
  const lookup = new Map(headers.map((h) => [normalizeHeader(h), h]));
  for (const alias of allowed) {
    const match = lookup.get(normalizeHeader(alias));
    if (match) return match;
  }
  return null;
}

module.exports = { resolveHeader, HEADER_ALIASES };
