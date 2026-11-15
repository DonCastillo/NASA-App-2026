import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import { STATUS_DISPLAY } from '../../data/statusDisplay'
import { SYSTEMS } from '../../data/systems'
import type { Health } from '../../lib/health'
import { formatDuration, rechecksFor, statusChanges } from '../../lib/summary'

// The last step of a check-in (plan/site-map.md → Check-in → Summary screen):
// what changed, the first action for anything that got worse, what to recheck, and the way home.
type Props = { before: Health; after: Health; durationMs: number }

export default function CheckInSummary({ before, after, durationMs }: Props) {
  const changes = statusChanges(before, after)
  const rechecks = rechecksFor(changes, after)
  const unchanged = SYSTEMS.length - changes.length

  return (
    <section
      className="mx-auto flex max-w-xl flex-col gap-5 p-4 md:p-8"
      aria-labelledby="summary-title"
    >
      <div className="flex items-center gap-3">
        <CheckCircle2 size={28} strokeWidth={1.5} className="shrink-0 text-ok" aria-hidden />
        <h1 id="summary-title" className="text-xl font-semibold text-text">
          Check-in complete
        </h1>
        <span className="reading ml-auto text-sm text-text-muted">
          {formatDuration(durationMs)}
        </span>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
          Changes
        </h2>
        <ul className="flex flex-col gap-2">
          {changes.map((change) => {
            const to = STATUS_DISPLAY[change.to]
            return (
              <li
                key={change.system.id}
                className="rounded-control border border-space-700 bg-space-900 px-3.5 py-3 text-sm"
              >
                <p className="text-text">
                  <span aria-hidden style={{ color: to.textColor }} className="font-bold">
                    {to.icon}
                  </span>{' '}
                  <span className="font-semibold">{change.system.name}</span>
                  <span className="text-text-muted">: {STATUS_DISPLAY[change.from].word} → </span>
                  <span style={{ color: to.textColor }} className="font-semibold">
                    {to.word}
                  </span>
                </p>
                <p className="mt-0.5 text-text-muted">{change.reason}</p>
                {change.firstAction && (
                  <p className="mt-1 text-text">
                    → {change.firstAction}{' '}
                    <Link
                      to={`/system/${change.system.id}`}
                      className="font-medium whitespace-nowrap text-accent underline-offset-2 hover:underline"
                    >
                      See what to do
                    </Link>
                  </p>
                )}
              </li>
            )
          })}
          <li className="flex items-center gap-2 px-1 text-sm text-text-muted">
            <span aria-hidden style={{ color: STATUS_DISPLAY.green.textColor }}>
              ✓
            </span>
            {changes.length === 0
              ? 'No changes: all systems as before'
              : `All other systems unchanged (${unchanged})`}
          </li>
        </ul>
      </div>

      {rechecks.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
            Next
          </h2>
          <ul className="flex flex-col gap-1.5 text-sm text-text">
            {rechecks.map((recheck) => (
              <li key={recheck.indicatorId} className="flex items-center gap-2">
                <span aria-hidden className="size-2 rounded-full bg-accent" />
                {recheck.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to="/"
        className="mt-2 flex h-11 items-center justify-center rounded-control bg-accent px-5 font-semibold text-space-950 hover:bg-accent-hover"
      >
        Back to Body Map
      </Link>
    </section>
  )
}
