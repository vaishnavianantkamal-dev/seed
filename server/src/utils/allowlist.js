const ANALYTICS_FIELDS = ['year','month','territory','division','itemGroup','item','packingSize','voucherType','status','staffName','partyName'];
const ALLOWED_MEASURES = ['quantity','caseKg','rate','value'];
const ALLOWED_AGGREGATIONS = ['sum','avg','count','min','max'];
const ALLOWED_ROW_FIELDS = ['year','month','territory','division','itemGroup','item','voucherType','status','staffName','partyName'];
const ALLOWED_COL_FIELDS = ['year','month','territory','division','itemGroup','item','voucherType','status','staffName','partyName'];

module.exports = { ANALYTICS_FIELDS, ALLOWED_MEASURES, ALLOWED_AGGREGATIONS, ALLOWED_ROW_FIELDS, ALLOWED_COL_FIELDS };
