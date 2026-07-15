function buildLineKey(row) {
  const voucherNo = row.voucherNo || '';
  const item = row.item || '';
  const partyName = row.partyName || '';
  const value = row.value ?? '';
  return `${voucherNo}|${item}|${partyName}|${value}`;
}

module.exports = { buildLineKey };
