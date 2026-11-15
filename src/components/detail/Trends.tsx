import { useState } from 'react'
import {
  type ChartRange,
  chartBaseline,
  chartMarkers,
  numberSeries,
  rangeStartDay,
  rawBands,
  statusTimeline,
} from '../../lib/chart'
import { setupBaseline } from '../../lib/derived'
import type { Dataset, Health } from '../../lib/health'
import type { SystemDef } from '../../types'
import StatusTimeline from './StatusTimeline'
import TrendChart from './TrendChart'

// Trends in System detail (plan/site-map.md → System detail §4, plan/tasks.md 4.4):
// one range control (7 d / 30 d / Mission) and a chart or status timeline per indicator with data.

const RANGES: { id: ChartRange; label: string }[] = [
  { id: '7d', label: '7 d' },
  { id: '30d', label: '30 d' },
  { id: 'mission', label: 'Mission' },
]

type Props = { system: SystemDef; health: Health; dataset: Dataset; today: Date }

export default function Trends({ system, health, dataset, today }: Props) {
  const [range, setRange] = useState<ChartRange>('30d')
  const currentDay = Math.max(1, health.progress.day)
  const fromDay = rangeStartDay(range, currentDay)

  const charts = system.indicators.flatMap((indicator) => {
    const history = health.history[indicator.id] ?? []
    const reference = health.references[indicator.id]
    const isNumber =
      indicator.input === 'number' ||
      indicator.input === 'numberPair' ||
      indicator.input === 'calculated'
    if (isNumber) {
      const points = numberSeries(history, today, currentDay, fromDay)
      if (!points.length) return []
      const baseline = chartBaseline(
        indicator,
        reference,
        setupBaseline(indicator.id, health.baselines),
      )
      return [
        <TrendChart
          key={indicator.id}
          indicator={indicator}
          points={points}
          bands={rawBands(indicator, reference)}
          baseline={baseline}
          markers={chartMarkers(
            indicator.id,
            dataset.events,
            dataset.checkIns,
            today,
            currentDay,
            fromDay,
          )}
          fromDay={fromDay}
          toDay={currentDay}
        />,
      ]
    }
    const days = statusTimeline(indicator, history, today, currentDay, fromDay, reference)
    if (!days.some((d) => d.status !== 'none')) return []
    return [<StatusTimeline key={indicator.id} indicator={indicator} days={days} />]
  })

  return (
    <section aria-labelledby="trends-title" className="px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <h3
          id="trends-title"
          className="text-xs font-semibold tracking-[0.08em] text-text-muted uppercase"
        >
          Trends
        </h3>
        <div
          role="group"
          aria-label="Range"
          className="inline-flex overflow-hidden rounded-control border border-space-700"
        >
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={range === r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                range === r.id ? 'bg-space-800 text-text' : 'text-text-muted hover:text-text'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {charts.length ? (
        <div className="mt-3 flex flex-col gap-5">{charts}</div>
      ) : (
        <p className="mt-3 text-sm text-text-muted">No readings in this range yet.</p>
      )}
    </section>
  )
}
