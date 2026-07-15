import { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import axios from '../api/axios';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [pivot, setPivot] = useState(null);

  useEffect(() => {
    async function load() {
      const [summaryRes, pivotRes] = await Promise.all([
        axios.post('/analytics/summary', { filters: {} }),
        axios.post('/analytics/pivot', { filters: {}, measure: 'caseKg', aggregation: 'sum', rowField: 'year', colField: 'status' })
      ]);
      setSummary(summaryRes.data.data);
      setPivot(pivotRes.data.data);
    }
    load();
  }, []);

  const chartData = (pivot?.rows || []).map((row) => ({ name: row.label, total: row.total }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Total Case/Kg', summary?.totalCaseKg],
          ['Total Value', `₹${summary?.totalValue || 0}`],
          ['Total Quantity', summary?.totalQuantity],
          ['Transactions', summary?.transactionCount]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Case/Kg by Year</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#2f7d4f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Top parties</h3>
          <div className="mt-4 overflow-hidden rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-3 py-2 text-left">Party</th>
                  <th className="px-3 py-2 text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2">Kundan Agencies</td>
                  <td className="px-3 py-2">₹9,600</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
