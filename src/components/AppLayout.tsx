import { NavLink, Outlet } from 'react-router'

// Shared frame around every page. Temporary bare nav for Phase 0.2;
// the real header, side nav and bottom nav are built in Phase 3.1–3.2.
const links = [
  { to: '/', label: 'Body Map' },
  { to: '/check-in', label: 'Check-in' },
  { to: '/routine', label: 'Routine' },
  { to: '/setup', label: 'Setup' },
  { to: '/about', label: 'About' },
]

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <nav className="flex gap-4 border-b border-slate-800 px-8 py-3 text-sm">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) => (isActive ? 'text-sky-400' : 'text-slate-400')}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      {/* The current page renders here */}
      <Outlet />
    </div>
  )
}
