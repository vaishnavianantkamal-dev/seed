import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from '../api/axios';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@ellora.local');
  const [password, setPassword] = useState('Admin@123');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.data.token);
      toast.success('Signed in');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7fbf7] p-6">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-emerald-800">Ellora Seeds CRM</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to explore sales analytics</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input className="w-full rounded border px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button className="w-full rounded bg-emerald-700 px-4 py-2 text-white" type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}
