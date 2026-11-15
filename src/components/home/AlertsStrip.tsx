import { Link } from 'react-router'
import { STATUS_DISPLAY } from '../../data/statusDisplay'
import { SYSTEMS } from '../../data/systems'
import type { Health } from '../../lib/health'

// Alerts strip (plan/site-map.md → Body Map): every red system, and an active solar particle event,
// each with its first action and a link to the system. Nothing is shown when nothing is red.
export default function AlertsStrip({ health }: { health: Health }) {
  const alerts = SYSTEMS.filter((system) => health.systems[system.id].status === 'red').map(
    (system) => {
      const solarEvent = system.id === 'radiation' && health.latest.solarParticleEvent === 2
      return {
        system,
        title: solarEvent ? 'Solar particle event in progress' : system.name,
        reason: health.systems[system.id].reason,
        action: system.actions.red[0],
      }
    },
  )
  if (!alerts.length) return null

  return (
    <section aria-label="Alerts" className="flex flex-col gap-2">
      {alerts.map(({ system, title, reason, action }) => (
        <div
          key={system.id}
          role="alert"
          className="flex items-start gap-3 rounded-control border border-alert/45 bg-alert/8 px-3.5 py-3 text-sm"
        >
          <span aria-hidden className="font-bold" style={{ color: STATUS_DISPLAY.red.textColor }}>
            {STATUS_DISPLAY.red.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text">
              {title}
              <span className="font-normal text-text-muted"> — {reason}</span>
            </p>
            <p className="text-text-muted">
              {action}{' '}
              <Link
                to={`/system/${system.id}`}
                className="font-medium whitespace-nowrap text-accent underline-offset-2 hover:underline"
              >
                See what to do
              </Link>
            </p>
          </div>
        </div>
      ))}
    </section>
  )
}
