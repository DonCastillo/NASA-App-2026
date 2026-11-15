import { STATUS_DISPLAY } from '../../data/statusDisplay'
import { describeChange, describeReading, formatReading, formatWhen } from '../../lib/format'
import type { Health } from '../../lib/health'
import type { HistoryPoint } from '../../lib/trends'
import type { Baselines, Indicator, IndicatorId, Status, SystemDef } from '../../types'

// Indicator cards in System detail (plan/site-map.md → System detail §3, plan/tasks.md 4.3):
// latest value, status, change vs baseline and when it was recorded. Amber and red come first.

const STATUS_ORDER: Record<Status, number> = { red: 0, amber: 1, green: 2, none: 3 }

/** Baselines from setup for indicators scored on absolute values (relative ones use describeReading) */
function setupBaseline(
  id: IndicatorId,
  baselines: Baselines,
): number | [number, number] | undefined {
  switch (id) {
    case 'bloodPressure':
      return baselines.restingSystolic !== undefined && baselines.restingDiastolic !== undefined
        ? [baselines.restingSystolic, baselines.restingDiastolic]
        : undefined
    case 'restingHeartRate':
      return baselines.restingHeartRate
    case 'sleepHours':
      return baselines.typicalSleepHours
    default:
      return undefined
  }
}

/** The newest non-skipped point in a history */
const lastRecorded = (points: HistoryPoint[] | undefined) =>
  [...(points ?? [])].reverse().find((p) => p.value !== null && p.value !== undefined)

type CardProps = {
  indicator: Indicator
  status: Status
  raisedBy?: string
  health: Health
  today: Date
}

export function IndicatorCard({ indicator, status, raisedBy, health, today }: CardProps) {
  const display = STATUS_DISPLAY[status]
  const value = health.latest[indicator.id]
  const recorded = value !== undefined
  // The dose rate is worked out from the latest dosimeter reading, so it shares its time
  const historyId = indicator.id === 'doseRate' ? 'cumulativeDose' : indicator.id
  const last = lastRecorded(health.history[historyId])
  const isRelative = indicator.scoring.kind === 'bands' && indicator.scoring.basis !== undefined
  const change = !recorded
    ? undefined
    : isRelative
      ? describeReading(indicator, value, health.references[indicator.id])
      : describeChange(indicator, value, setupBaseline(indicator.id, health.baselines))
  const emphasise = status === 'amber' || status === 'red'
  // Follow-ups are only asked when something triggers them, so "not recorded" would sound like a skip
  const word = recorded
    ? display.word
    : indicator.tier === 'followUp'
      ? 'Not asked recently'
      : 'Not recorded'

  return (
    <li
      data-indicator={indicator.id}
      className="flex items-start gap-3 rounded-control border border-space-700 bg-space-950 px-3.5 py-3"
    >
      <span
        aria-hidden
        className="mt-1.5 size-2.5 shrink-0 rounded-full"
        style={{ background: display.color }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text">{indicator.name}</p>
        <p className="text-xs text-text-muted">
          <span style={{ color: display.textColor }} className="font-semibold">
            {word}
          </span>
          {recorded && last && <> · {formatWhen(last.recordedAt, today)}</>}
          {!recorded && last && <> · last recorded {formatWhen(last.recordedAt, today)}</>}
        </p>
        {raisedBy && <p className="mt-1 text-xs text-text-muted">{raisedBy}</p>}
      </div>
      <div className="max-w-[45%] shrink-0 text-right">
        <p
          className={`reading text-base ${recorded ? '' : 'text-sm text-text-muted'}`}
          style={emphasise ? { color: display.textColor } : undefined}
        >
          {recorded ? formatReading(indicator, value) : <span aria-label="No value">–</span>}
        </p>
        {change && <p className="text-xs text-text-muted">{change}</p>}
      </div>
    </li>
  )
}

type Props = { system: SystemDef; health: Health; today: Date }

export default function IndicatorCards({ system, health, today }: Props) {
  const results = health.systems[system.id].indicators
  const sorted = system.indicators
    .map((indicator, index) => ({
      indicator,
      index,
      result: results.find((r) => r.indicatorId === indicator.id),
    }))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.result?.status ?? 'none'] - STATUS_ORDER[b.result?.status ?? 'none'] ||
        a.index - b.index,
    )

  return (
    <section aria-labelledby="indicators-title" className="px-5 py-4">
      <h3
        id="indicators-title"
        className="text-xs font-semibold tracking-[0.08em] text-text-muted uppercase"
      >
        Indicators
      </h3>
      <ul className="mt-2 flex flex-col gap-2">
        {sorted.map(({ indicator, result }) => (
          <IndicatorCard
            key={indicator.id}
            indicator={indicator}
            status={result?.status ?? 'none'}
            raisedBy={result?.raisedBy}
            health={health}
            today={today}
          />
        ))}
      </ul>
    </section>
  )
}
