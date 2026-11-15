import { Link } from 'react-router'
import { STATUS_DISPLAY } from '../../data/statusDisplay'
import { SYSTEMS } from '../../data/systems'
import type { Health } from '../../lib/health'
import type { Status } from '../../types'

// Readiness summary (plan/site-map.md → Body Map): how many systems are OK / Watch / Act, plus the
// most urgent item. Red items are listed in the alerts strip, so here the most urgent line is only
// shown when the worst status is amber.
const ORDER: Status[] = ['green', 'amber', 'red', 'none']

export default function ReadinessSummary({ health }: { health: Health }) {
  const urgent = health.mostUrgent
  const urgentSystem = urgent && SYSTEMS.find((s) => s.id === urgent.systemId)

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      <h2 className="sr-only">Readiness</h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Systems by status">
        {ORDER.filter((status) => health.readiness[status] > 0).map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ background: STATUS_DISPLAY[status].color }}
            />
            <span className="reading font-medium text-text">{health.readiness[status]}</span>
            <span className="text-text-muted">{STATUS_DISPLAY[status].word}</span>
          </li>
        ))}
      </ul>
      {urgent?.status === 'amber' && urgentSystem && (
        <p className="text-text-muted">
          <span style={{ color: STATUS_DISPLAY.amber.textColor }} className="font-semibold">
            {STATUS_DISPLAY.amber.icon} Most urgent:
          </span>{' '}
          <Link
            to={`/system/${urgent.systemId}`}
            className="text-text underline-offset-2 hover:underline"
          >
            {urgentSystem.name}
          </Link>{' '}
          — {urgent.reason}
        </p>
      )}
    </div>
  )
}
