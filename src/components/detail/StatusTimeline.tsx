import { STATUS_DISPLAY } from '../../data/statusDisplay'
import type { TimelineDay } from '../../lib/chart'
import type { Indicator } from '../../types'

// Trend for scales, yes/no and checklists (plan/tasks.md 4.4): one colored square per mission day.
// Grey = not recorded that day. Each square has a tooltip ("Day 148: Mild").
export default function StatusTimeline({
  indicator,
  days,
}: {
  indicator: Indicator
  days: TimelineDay[]
}) {
  const recorded = days.filter((d) => d.status !== 'none')
  const counts = (['red', 'amber', 'green'] as const)
    .map((status) => ({ status, n: recorded.filter((d) => d.status === status).length }))
    .filter((c) => c.n > 0)
  const summary = recorded.length
    ? `${indicator.name}: ${counts.map((c) => `${c.n} ${STATUS_DISPLAY[c.status].word}`).join(', ')} over ${days.length} days`
    : `${indicator.name}: nothing recorded in this range`

  return (
    <figure className="m-0" aria-label={summary}>
      <figcaption className="mb-1.5 text-sm text-text">{indicator.name}</figcaption>
      <div aria-hidden className="flex flex-wrap gap-[3px]">
        {days.map((d) => (
          <span
            key={d.day}
            title={`Day ${d.day}: ${d.label}`}
            className="h-4 min-w-[5px] flex-1 basis-[5px] rounded-[2px]"
            style={{
              background: STATUS_DISPLAY[d.status].color,
              opacity: d.status === 'none' ? 0.25 : 0.85,
            }}
          />
        ))}
      </div>
      <p className="mt-1 flex justify-between text-[11px] text-text-muted" aria-hidden>
        <span>D{days[0]?.day}</span>
        <span>D{days[days.length - 1]?.day}</span>
      </p>
    </figure>
  )
}
