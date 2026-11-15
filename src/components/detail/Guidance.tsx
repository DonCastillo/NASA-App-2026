import { Link } from 'react-router'
import { formatDelay } from '../../lib/format'
import type { MissionProfile, Status, SystemDef } from '../../types'

// "What to do now" in System detail (plan/site-map.md → System detail §2, plan/tasks.md 4.2):
// the system's actions for its status, then the escalation line worded for the mission and its
// current comms delay. Green shrinks to "Keep your routine" plus one prevention tip.
type Props = {
  system: SystemDef
  status: Status
  mission: MissionProfile
  commsDelaySeconds: number
}

const label = 'text-xs font-semibold tracking-[0.08em] text-text-muted uppercase'

export default function Guidance({ system, status, mission, commsDelaySeconds }: Props) {
  if (status === 'none') {
    return (
      <section aria-labelledby="guidance-title" className="px-5 py-4">
        <h3 id="guidance-title" className={label}>
          What to do now
        </h3>
        <p className="mt-2 text-sm text-text">
          Nothing is recorded for this system yet.{' '}
          <Link
            to={`/check-in?system=${system.id}`}
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Check it now
          </Link>
        </p>
      </section>
    )
  }

  const actions = status === 'green' ? [] : system.actions[status]
  const delayLabel = `${mission.name} · ${formatDelay(commsDelaySeconds)} delay`

  return (
    <section aria-labelledby="guidance-title" className="px-5 py-4">
      <h3 id="guidance-title" className={label}>
        What to do now
      </h3>

      {status === 'green' ? (
        <div className="mt-2 text-sm">
          <p className="font-medium text-text">Keep your routine.</p>
          <p className="mt-1 text-text-muted">Tip: {system.actions.green[0]}</p>
        </div>
      ) : (
        <>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text marker:text-text-muted">
            {actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          <p className="mt-3 rounded-control bg-space-800 px-3 py-2.5 text-sm text-text">
            <span className="font-semibold">{delayLabel}:</span> {mission.escalation[status]}
          </p>
        </>
      )}

      {system.extraAdvice?.map((advice) => (
        <p key={advice} className="mt-3 text-sm text-text-muted">
          {advice}
        </p>
      ))}
    </section>
  )
}
