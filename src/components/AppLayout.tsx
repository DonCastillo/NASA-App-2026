import { NavLink, Outlet } from 'react-router'
import Logo from './Logo'

// Shared frame around every page. Temporary bare nav for Phase 0;
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
    <div className="min-h-screen">
      <nav className="flex items-center gap-6 border-b border-space-700 bg-space-900 px-8 py-3 text-sm">
        <Logo />
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              isActive ? 'font-medium text-accent' : 'text-text-muted hover:text-text'
            }
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
