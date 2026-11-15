import { ClipboardCheck, PersonStanding, Satellite, type LucideIcon } from 'lucide-react'
import { WELCOME_CARDS } from '../../data/onboarding'
import Modal from '../Modal'

// Overlay A — Welcome (plan/site-map.md → Overlays, plan/tasks.md 7.2): three cards, then
// "Explore demo crew" (starts the guided tour) or "Set up my profile". Shown once; reopen from About.

const ICONS: LucideIcon[] = [PersonStanding, ClipboardCheck, Satellite]

type Props = {
  onExplore: () => void
  onSetUp: () => void
}

export default function WelcomeOverlay({ onExplore, onSetUp }: Props) {
  return (
    <Modal eyebrow="Welcome to BodyMap" title="Crew health at a glance" onClose={onExplore}>
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2.5">
          {WELCOME_CARDS.map((card, i) => {
            const Icon = ICONS[i]
            return (
              <li
                key={card.title}
                className="flex gap-3 rounded-control border border-space-700 bg-space-800 px-3.5 py-3"
              >
                <Icon
                  size={22}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-accent"
                  aria-hidden
                />
                <div>
                  <h3 className="text-sm font-semibold text-text">{card.title}</h3>
                  <p className="mt-0.5 text-[13px] text-text-muted">{card.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onExplore}
            className="h-11 flex-1 rounded-control bg-accent px-4 font-semibold text-space-950 hover:bg-accent-hover"
          >
            Explore demo crew
          </button>
          <button
            type="button"
            onClick={onSetUp}
            className="h-11 flex-1 rounded-control border border-space-700 px-4 font-semibold text-text hover:bg-space-800"
          >
            Set up my profile
          </button>
        </div>
      </div>
    </Modal>
  )
}
