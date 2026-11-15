import { Bell, Plus } from 'lucide-react'
import { Link } from 'react-router'
import CrewMenu from './CrewMenu'
import Logo from './Logo'
import MissionDay from './MissionDay'
import MissionMenu from './MissionMenu'

// The header on every page (plan/site-map.md → Navigation, plan/tasks.md 3.2):
//   BodyMap · Crew ▾ · Mission ▾ · Day 150/210 · 14 min delay · 🔔 · [Log event]
// On phones: bell and Log event are icons only, and mission + day move to a second line.
// The bell (Phase 6) and Log event (Phase 5) are placeholders for now.
export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-space-700 bg-space-900">
      <div className="flex items-center gap-3 px-4 py-2.5 md:gap-4 md:px-6">
        <Link to="/" aria-label="BodyMap home" className="shrink-0 rounded-control">
          <Logo animated />
        </Link>
        <CrewMenu />
        <div className="hidden items-center gap-4 md:flex">
          <MissionMenu />
          <MissionDay />
        </div>
        <div className="flex-1" />
        <button
          type="button"
          aria-label="Notifications (coming soon)"
          disabled
          className="grid size-10 place-items-center rounded-control border border-space-700 text-text-muted disabled:opacity-60"
        >
          <Bell size={20} strokeWidth={1.5} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Log event (coming soon)"
          disabled
          className="inline-flex h-10 items-center gap-2 rounded-control border border-space-700 px-2.5 text-sm font-semibold text-text disabled:opacity-60 md:px-3.5"
        >
          <Plus size={18} strokeWidth={1.5} aria-hidden />
          <span className="hidden md:inline">Log event</span>
        </button>
      </div>
      {/* Phone: mission and day on their own line */}
      <div className="flex items-center gap-3 border-t border-space-700 px-4 py-2 md:hidden">
        <MissionMenu />
        <div className="flex-1">
          <MissionDay />
        </div>
      </div>
    </header>
  )
}
