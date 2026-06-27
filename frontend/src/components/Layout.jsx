// frontend/src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV = [
  { to: '/app',           label: 'Dashboard', icon: '◈', end: true },
  { to: '/app/pitches',   label: 'Pitches',   icon: '✉', end: false },
  { to: '/app/brands',    label: 'Brands',    icon: '◆', end: false },
  { to: '/app/settings',  label: 'Settings',  icon: '◎', end: false },
];

export default function Layout() {
  const { signOut } = useAuth();
  const navigate    = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-[#0a0005]">
      {/* Sidebar */}
      <aside className="w-56 border-r border-white/[.06] flex flex-col fixed h-full z-10 bg-[#0a0005]">
        {/* Logo */}
        <div className="p-6 border-b border-white/[.06]">
          <div className="text-[9px] tracking-[.32em] uppercase text-brand mb-1">Sponsorship</div>
          <div className="font-serif text-xl font-black text-white leading-none">PROSPECTOR</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 text-[10px] tracking-[.2em] uppercase transition-colors ${
                  isActive
                    ? 'text-brand border-l-2 border-brand bg-brand/5 -ml-px pl-[13px]'
                    : 'text-white/40 hover:text-white/70'
                }`
              }>
              <span className="text-sm">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-white/[.06]">
          <button onClick={handleSignOut}
            className="w-full text-[10px] tracking-[.2em] uppercase text-white/20 hover:text-brand transition-colors py-2 text-left flex items-center gap-2">
            <span>→</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 min-h-screen bg-[#0a0005]">
        <Outlet />
      </main>
    </div>
  );
}
