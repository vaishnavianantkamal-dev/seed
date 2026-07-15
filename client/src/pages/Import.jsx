import { useEffect, useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

export default function ImportPage() {
  const [excelFile, setExcelFile] = useState(null);
  const [batches, setBatches] = useState([]);

  const loadBatches = async () => {
    try {
      const res = await axios.get('/import/batches');
      setBatches(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const uploadExcel = async () => {
    if (!excelFile) return toast.error('Choose an Excel file');
    const formData = new FormData();
    formData.append('file', excelFile);
    try {
      const res = await axios.post('/import/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = res.data.data || {};
      if (data.mode === 'transactions') {
        toast.success(`Imported ${data.rowsInserted} transaction rows`);
      } else {
        toast.success(`Imported ${data.inserted} party mappings`);
      }
      loadBatches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    }
  };

  const deleteBatch = async (id) => {
    try {
      await axios.delete(`/import/batch/${id}`);
      toast.success('Batch removed');
      loadBatches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rollback failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Data Import</h2>
        <p className="mt-2 text-sm text-slate-500">Upload a single Excel file. The system will detect whether it contains sales ledger rows or party master rows and import it automatically.</p>
        <div className="mt-6 rounded-xl border border-dashed border-emerald-300 p-4">
          <h3 className="font-medium">Excel file (.xlsx)</h3>
          <input type="file" accept=".xlsx,.xls" onChange={(e) => setExcelFile(e.target.files[0])} className="mt-3" />
          <button onClick={uploadExcel} className="mt-4 rounded bg-emerald-700 px-4 py-2 text-white">Import Excel</button>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h3 className="font-semibold">Recent import batches</h3>
        <div className="mt-4 overflow-hidden rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-emerald-50">
              <tr>
                <th className="px-3 py-2 text-left">File</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Inserted</th>
                <th className="px-3 py-2 text-left">Skipped</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch._id}>
                  <td className="px-3 py-2">{batch.filename}</td>
                  <td className="px-3 py-2">{batch.type}</td>
                  <td className="px-3 py-2">{batch.rowsInserted}</td>
                  <td className="px-3 py-2">{batch.rowsSkipped}</td>
                  <td className="px-3 py-2"><button onClick={() => deleteBatch(batch._id)} className="rounded bg-red-500 px-3 py-1 text-white">Rollback</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
