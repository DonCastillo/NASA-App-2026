import { CalendarDays, ClipboardCheck, Info, PersonStanding, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'

// Main navigation (plan/site-map.md → Navigation): side nav on desktop, bottom nav on phones.
// Setup is not in the nav; it's reached from the Crew ▾ menu in the header.

export type NavPath = '/' | '/check-in' | '/routine' | '/about'

type NavItem = { to: NavPath; label: string; icon: LucideIcon }

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Body Map', icon: PersonStanding },
  { to: '/check-in', label: 'Check-in', icon: ClipboardCheck },
  { to: '/routine', label: 'Routine', icon: CalendarDays },
  { to: '/about', label: 'About', icon: Info },
]

type Props = {
  variant: 'side' | 'bottom'
  /** Due-task counts shown as a badge, e.g. { '/check-in': 1 } (from useTasks) */
  badges?: Partial<Record<NavPath, number>>
}

function Badge({ count, variant }: { count: number; variant: Props['variant'] }) {
  return (
    <span
      aria-label={`${count} due`}
      className={
        variant === 'side'
          ? 'ml-auto rounded-full bg-warn px-1.5 text-[11px] leading-5 font-semibold text-space-950'
          : 'absolute -top-1 left-1/2 ml-2 min-w-4 rounded-full bg-warn px-1 text-center text-[10px] leading-4 font-semibold text-space-950'
      }
    >
      {count}
    </span>
  )
}

export default function Nav({ variant, badges = {} }: Props) {
  if (variant === 'side') {
    return (
      <nav aria-label="Main" className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const count = badges[to] ?? 0
          return (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex h-11 items-center gap-2.5 rounded-control px-3 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-accent/12 text-accent'
                    : 'text-text-muted hover:bg-space-800 hover:text-text'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.5} aria-hidden />
              {label}
              {count > 0 && <Badge count={count} variant="side" />}
            </NavLink>
          )
        })}
      </nav>
    )
  }

  return (
    <nav aria-label="Main" className="grid grid-cols-4">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const count = badges[to] ?? 0
        return (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                isActive ? 'text-accent' : 'text-text-muted'
              }`
            }
          >
            <span className="relative">
              <Icon size={20} strokeWidth={1.5} aria-hidden />
              {count > 0 && <Badge count={count} variant="bottom" />}
            </span>
            {label}
          </NavLink>
        )
      })}
    </nav>
  )
}
