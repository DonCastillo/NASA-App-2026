import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import BellMenu from './BellMenu'
import CrewMenu from './CrewMenu'
import LogEventOverlay from './LogEventOverlay'
import Logo from './Logo'
import MissionDay from './MissionDay'
import MissionMenu from './MissionMenu'

// The header on every page (plan/site-map.md → Navigation, plan/tasks.md 3.2):
//   BodyMap · Crew ▾ · Mission ▾ · Day 150/210 · 14 min delay · 🔔 · [Log event]
// On phones: bell and Log event are icons only, and mission + day move to a second line.
// Log event shows its word from desktop width (lg) up, so the header fits on tablets.
export default function Header() {
  const [logging, setLogging] = useState(false)
  return (
    <header className="sticky top-0 z-20 border-b border-space-700 bg-space-900">
      <div className="flex items-center gap-3 px-4 py-2.5 md:gap-4 md:px-6">
        <Link to="/" aria-label="BodyMap home" className="shrink-0 rounded-control">
          <Logo animated />
        </Link>
        <CrewMenu />
        <div className="hidden items-center gap-4 md:flex">
          <div data-tour="mission">
            <MissionMenu />
          </div>
          <MissionDay />
        </div>
        <div className="flex-1" />
        <div data-tour="bell">
          <BellMenu />
        </div>
        <button
          type="button"
          aria-label="Log event"
          data-tour="log-event"
          aria-haspopup="dialog"
          onClick={() => setLogging(true)}
          className="inline-flex h-10 items-center gap-2 rounded-control border border-space-700 px-2.5 text-sm font-semibold text-text transition-colors duration-150 hover:bg-space-800 lg:px-3.5"
        >
          <Plus size={18} strokeWidth={1.5} aria-hidden />
          <span className="hidden lg:inline">Log event</span>
        </button>
      </div>
      {/* Phone: mission and day on their own line */}
      <div className="flex items-center gap-3 border-t border-space-700 px-4 py-2 md:hidden">
        <div data-tour="mission">
          <MissionMenu />
        </div>
        <div className="flex-1">
          <MissionDay />
        </div>
      </div>
      {logging && <LogEventOverlay onClose={() => setLogging(false)} />}
    </header>
  )
}
