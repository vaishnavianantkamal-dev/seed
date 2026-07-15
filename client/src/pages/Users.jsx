import { useEffect, useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const loadUsers = async () => {
    const res = await axios.get('/users');
    setUsers(res.data.data);
  };

  useEffect(() => { loadUsers(); }, []);

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/users', { name, email, password, role });
      toast.success('User created');
      setName(''); setEmail(''); setPassword('');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create user');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">Users</h2>
        <table className="mt-4 min-w-full text-sm">
          <thead className="bg-emerald-50">
            <tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Email</th><th className="px-3 py-2 text-left">Role</th></tr>
          </thead>
          <tbody>
            {users.map((user) => <tr key={user._id}><td className="px-3 py-2">{user.name}</td><td className="px-3 py-2">{user.email}</td><td className="px-3 py-2">{user.role}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Create user</h3>
        <form onSubmit={createUser} className="mt-4 space-y-3">
          <input className="w-full rounded border px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full rounded border px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded border px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <select className="w-full rounded border px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button className="w-full rounded bg-emerald-700 px-4 py-2 text-white">Create</button>
        </form>
      </div>
    </div>
  );
}
