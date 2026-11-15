import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { STATUS_DISPLAY } from '../../data/statusDisplay'
import { type ChartPoint, type Marker, type RawBand, yDomain } from '../../lib/chart'
import { formatNumber } from '../../lib/format'
import type { Indicator } from '../../types'

// One indicator's trend (plan/branding.md §6 → Charts): status bands at 12%, a 2 px accent line,
// a dashed baseline, event lines and countermeasure triangles. X-axis = mission day.
type Props = {
  indicator: Indicator
  points: ChartPoint[]
  bands: RawBand[]
  baseline?: number
  markers: Marker[]
  fromDay: number
  toDay: number
}

// Axis line color, and tick text style (no stroke on the text, so labels stay crisp)
const AXIS_LINE = 'var(--color-space-700)'
const TICK = { fontSize: 11, fill: 'var(--color-text-muted)' }

export default function TrendChart({
  indicator,
  points,
  bands,
  baseline,
  markers,
  fromDay,
  toDay,
}: Props) {
  const [yMin, yMax] = yDomain(points, baseline)
  const unit = indicator.unit ?? ''
  const isPair = points.some((p) => p.value2 !== undefined)
  const first = points[0]
  const last = points[points.length - 1]
  const summary =
    first && last
      ? `${indicator.name}, day ${first.day} to ${last.day}: from ${formatNumber(first.value)} to ${formatNumber(last.value)} ${unit}`.trim()
      : `${indicator.name}: no readings in this range`

  return (
    <figure className="m-0" aria-label={summary}>
      <figcaption className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-text">{indicator.name}</span>
        {unit && <span className="text-xs text-text-muted">{unit}</span>}
      </figcaption>
      <div className="h-40" aria-hidden>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 420, height: 160 }}
        >
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--color-space-700)" strokeOpacity={0.6} vertical={false} />
            {bands.map((band, i) => (
              <ReferenceArea
                key={i}
                y1={Math.max(band.from ?? yMin, yMin)}
                y2={Math.min(band.to ?? yMax, yMax)}
                fill={STATUS_DISPLAY[band.status].color}
                fillOpacity={0.12}
                strokeOpacity={0}
                ifOverflow="hidden"
              />
            ))}
            <XAxis
              dataKey="day"
              type="number"
              domain={[fromDay, toDay]}
              allowDecimals={false}
              tick={TICK}
              stroke={AXIS_LINE}
              tickFormatter={(day: number) => `D${day}`}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={TICK}
              stroke={AXIS_LINE}
              width={48}
              tickFormatter={(v: number) => formatNumber(v)}
            />
            {baseline !== undefined && (
              <ReferenceLine
                y={baseline}
                stroke="var(--color-text-muted)"
                strokeDasharray="4 4"
                label={{
                  value: 'baseline',
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: 'var(--color-text-muted)',
                }}
              />
            )}
            {markers
              .filter((m) => m.kind === 'event')
              .map((m) => (
                <ReferenceLine
                  key={`e${m.day}${m.label}`}
                  x={m.day}
                  stroke="var(--color-text-muted)"
                  strokeOpacity={0.6}
                  label={{
                    value: m.label,
                    position: 'insideTopLeft',
                    fontSize: 10,
                    fill: 'var(--color-text-muted)',
                  }}
                />
              ))}
            {markers
              .filter((m) => m.kind === 'countermeasure')
              .map((m, i) => (
                <ReferenceDot
                  key={`c${m.day}${i}`}
                  x={m.day}
                  y={yMin}
                  r={0}
                  ifOverflow="visible"
                  shape={(props: { cx?: number; cy?: number }) => (
                    <path
                      d={`M${(props.cx ?? 0) - 4} ${(props.cy ?? 0) - 1} l4 -7 l4 7 z`}
                      fill="var(--color-text-muted)"
                    />
                  )}
                />
              ))}
            <Tooltip
              contentStyle={{
                background: 'var(--color-space-900)',
                border: '1px solid var(--color-space-700)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(day) => `Day ${day}`}
              formatter={(value) => [`${formatNumber(Number(value))} ${unit}`.trim(), '']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={points.length <= 31 ? { r: 2.5, fill: 'var(--color-accent)' } : false}
              isAnimationActive={false}
            />
            {isPair && (
              <Line
                type="monotone"
                dataKey="value2"
                stroke="var(--color-accent)"
                strokeOpacity={0.55}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
