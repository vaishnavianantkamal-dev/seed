import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import axios from '../api/axios';

const measureOptions = [{ value: 'caseKg', label: 'Case/Kg' }, { value: 'quantity', label: 'Quantity' }, { value: 'rate', label: 'Rate' }, { value: 'value', label: 'Value' }];
const aggregationOptions = [{ value: 'sum', label: 'Sum' }, { value: 'avg', label: 'Avg' }, { value: 'count', label: 'Count' }, { value: 'min', label: 'Min' }, { value: 'max', label: 'Max' }];
const rowFieldOptions = [{ value: 'year', label: 'Year' }, { value: 'month', label: 'Month' }, { value: 'territory', label: 'Territory' }, { value: 'division', label: 'Division' }, { value: 'itemGroup', label: 'Item Group' }, { value: 'item', label: 'Item' }, { value: 'status', label: 'Status' }];
const sortOptions = [{ value: 'desc', label: 'Grand Total: High to Low' }, { value: 'asc', label: 'Grand Total: Low to High' }];

// Validated categorical order — see dataviz skill references/palette.md. Fixed order, never cycled/reassigned.
const PIE_COLORS = ['#2a78d6', '#008300', '#e87ba4', '#eda100', '#1baf7a', '#eb6834'];
const PIE_SLICE_CAP = 6;

export default function ExplorePage() {
  const [filters, setFilters] = useState({});
  const [options, setOptions] = useState({});
  const [pivot, setPivot] = useState(null);
  const [measure, setMeasure] = useState('caseKg');
  const [aggregation, setAggregation] = useState('sum');
  const [rowField, setRowField] = useState('year');
  const [colField, setColField] = useState('status');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const fieldDefinitions = useMemo(() => [
    { key: 'year', label: 'Year', apiKey: 'years' },
    { key: 'month', label: 'Month', apiKey: 'months' },
    { key: 'territory', label: 'Territory', apiKey: 'territories' },
    { key: 'division', label: 'Division', apiKey: 'divisions' },
    { key: 'itemGroup', label: 'Item Group', apiKey: 'itemGroups' },
    { key: 'item', label: 'Item', apiKey: 'items' },
    { key: 'voucherType', label: 'Voucher Type', apiKey: 'voucherTypes' },
    { key: 'status', label: 'Status', apiKey: 'statuses' },
    { key: 'staffName', label: 'Staff', apiKey: 'staff' },
    { key: 'partyName', label: 'Party', apiKey: 'parties' }
  ], []);

  useEffect(() => {
    async function load() {
      const res = await axios.get('/analytics/filters');
      setOptions(res.data.data);
    }
    load();
  }, []);

  useEffect(() => {
    async function loadPivot() {
      const payload = {
        filters: {
          ...filters,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null
        },
        measure,
        aggregation,
        rowField,
        colField
      };
      const res = await axios.post('/analytics/pivot', payload);
      setPivot(res.data.data);
    }
    loadPivot();
  }, [filters, measure, aggregation, rowField, colField, dateFrom, dateTo]);

  const setFilterValue = (key, values) => {
    setFilters((prev) => ({ ...prev, [key]: values.map((item) => item.value) }));
  };

  const sortedRows = useMemo(() => {
    const rows = pivot?.rows || [];
    const sign = sortOrder === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => sign * (a.total - b.total));
  }, [pivot, sortOrder]);

  const pieData = useMemo(() => {
    const visible = sortedRows.slice(0, PIE_SLICE_CAP).map((row) => ({ name: row.label, value: row.total }));
    const rest = sortedRows.slice(PIE_SLICE_CAP);
    if (rest.length) {
      visible.push({ name: 'Other', value: rest.reduce((sum, row) => sum + row.total, 0) });
    }
    return visible;
  }, [sortedRows]);

  const resetFilters = () => {
    setFilters({});
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Filter panel</h3>
          <div className="mt-4 space-y-3">
            {fieldDefinitions.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-sm font-medium">{field.label}</label>
                <Select isMulti options={(options[field.apiKey] || []).map((item) => ({ value: item, label: item }))} onChange={(value) => setFilterValue(field.key, value || [])} />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm font-medium">Date from</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date to</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <button onClick={resetFilters} className="mt-4 rounded bg-slate-100 px-3 py-2 text-sm">Reset filters</button>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-sm font-medium">Measure</label>
              <Select options={measureOptions} value={measureOptions.find((item) => item.value === measure)} onChange={(value) => setMeasure(value.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Aggregation</label>
              <Select options={aggregationOptions} value={aggregationOptions.find((item) => item.value === aggregation)} onChange={(value) => setAggregation(value.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Rows</label>
              <Select options={rowFieldOptions} value={rowFieldOptions.find((item) => item.value === rowField)} onChange={(value) => setRowField(value.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Columns</label>
              <Select options={[{ value: '', label: 'None' }, ...rowFieldOptions]} value={(rowFieldOptions.find((item) => item.value === colField) || { value: '', label: 'None' })} onChange={(value) => setColField(value.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Sort</label>
              <Select options={sortOptions} value={sortOptions.find((item) => item.value === sortOrder)} onChange={(value) => setSortOrder(value.value)} />
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-sm text-slate-600">Matched rows: {pivot?.matchedRows || 0}</p>
            <p className="text-lg font-semibold">Grand total: {pivot?.grandTotal || 0}</p>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-emerald-50">
                  <th className="border px-3 py-2 text-left">Row Labels</th>
                  {pivot?.columns?.map((col) => (<th key={col} className="border px-3 py-2 text-left">{col}</th>))}
                  <th className="border px-3 py-2 text-left">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.label}>
                    <td className="border px-3 py-2 font-medium">{row.label}</td>
                    {pivot?.columns?.map((col) => (<td key={col} className="border px-3 py-2">{row.cells[col] ?? 0}</td>))}
                    <td className="border px-3 py-2 font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pieData.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold">{rowFieldOptions.find((item) => item.value === rowField)?.label} breakdown</h3>
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
