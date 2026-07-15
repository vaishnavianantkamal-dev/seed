import { NavLink, useNavigate } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/explore', label: 'Explore' },
  { to: '/import', label: 'Data Import' },
  { to: '/users', label: 'Users' }
];

export default function Layout({ children }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f7fbf7] text-slate-800">
      <div className="flex min-h-screen">
        <aside className="w-64 bg-[#16351f] p-6 text-white">
          <h1 className="text-2xl font-semibold">Ellora CRM</h1>
          <p className="mt-2 text-sm text-emerald-100">Sales analytics for seeds</p>
          <nav className="mt-8 space-y-2">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => `block rounded px-3 py-2 ${isActive ? 'bg-emerald-700' : 'hover:bg-emerald-800'}`}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold">Ellora Seeds Sales Analytics CRM</h2>
              <p className="text-sm text-slate-500">Explore, filter and export your sales data</p>
            </div>
            <button onClick={logout} className="rounded bg-emerald-700 px-4 py-2 text-white">Logout</button>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
