import type { KeyboardEvent } from 'react'
import { STATUS_DISPLAY } from '../../data/statusDisplay'
import type { SystemHealth } from '../../lib/health'
import type { SystemDef } from '../../types'
import type { Point } from './geometry'

// One callout pin on the body figure (plan/branding.md §5): status color + icon + label with the
// current reading and status word. Red pins pulse. Radiation is drawn as a ring gauge.
// Acts as a link: click, Enter or Space opens the system; Tab moves between pins.

type Props = {
  system: SystemDef
  health: SystemHealth
  position: Point
  /** Radiation only: share of the dose budget used, 0–100+ */
  gaugePercent?: number
  highlighted: boolean
  dimmed: boolean
  tooltipId?: string
  onHighlight: (on: boolean) => void
  onOpen: () => void
}

const GAUGE_RADIUS = 15
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS

export default function Pin({
  system,
  health,
  position: { x, y },
  gaugePercent,
  highlighted,
  dimmed,
  tooltipId,
  onHighlight,
  onOpen,
}: Props) {
  const display = STATUS_DISPLAY[health.status]
  const left = system.pin.side === 'left'
  const isGauge = system.id === 'radiation'
  const labelX = left ? x - 28 : x + (isGauge ? 30 : 28)
  const anchor = left ? 'end' : 'start'

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }

  return (
    <g
      role="link"
      tabIndex={0}
      aria-label={`${system.name}: ${display.word}${health.headline ? `, ${health.headline}` : ''}`}
      aria-describedby={tooltipId}
      data-system={system.id}
      className="cursor-pointer outline-none transition-opacity duration-150"
      style={{ opacity: dimmed ? 0.4 : 1 }}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      onMouseEnter={() => onHighlight(true)}
      onMouseLeave={() => onHighlight(false)}
      onFocus={() => onHighlight(true)}
      onBlur={() => onHighlight(false)}
    >
      {/* Soft glow; red pins pulse */}
      <circle
        cx={x}
        cy={y}
        r={isGauge ? 23 : 21}
        fill={display.color}
        opacity={health.status === 'red' ? undefined : isGauge ? 0.18 : 0.28}
        className={`transition-[fill] duration-250 ${health.status === 'red' ? 'pin-pulse' : ''}`}
      />
      {/* Highlight ring (hover, focus or a linked system-list row) */}
      <circle
        cx={x}
        cy={y}
        r={isGauge ? 21 : 18}
        fill="none"
        stroke={highlighted ? 'var(--color-accent)' : 'transparent'}
        strokeWidth={2}
      />

      {isGauge ? (
        <>
          <circle
            cx={x}
            cy={y}
            r={GAUGE_RADIUS}
            fill="var(--color-space-900)"
            stroke="var(--color-space-700)"
            strokeWidth={4}
          />
          <circle
            cx={x}
            cy={y}
            r={GAUGE_RADIUS}
            fill="none"
            stroke={display.color}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${(Math.min(100, gaugePercent ?? 0) / 100) * GAUGE_CIRCUMFERENCE} ${GAUGE_CIRCUMFERENCE}`}
            transform={`rotate(-90 ${x} ${y})`}
            className="transition-[stroke] duration-250"
          />
          <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fill={display.color} aria-hidden>
            ☢
          </text>
        </>
      ) : (
        <>
          <circle
            cx={x}
            cy={y}
            r={13}
            fill={display.color}
            className="transition-[fill] duration-250"
          />
          <text
            x={x}
            y={y + 4}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill={health.status === 'red' ? '#fff' : 'var(--color-space-950)'}
            aria-hidden
          >
            {display.icon}
          </text>
        </>
      )}

      {/* Label: name, then reading · status word */}
      <text
        x={labelX}
        y={y - 3}
        textAnchor={anchor}
        fontSize={13}
        fontWeight={600}
        fill="var(--color-text)"
        aria-hidden
      >
        {system.pin.label}
      </text>
      <text
        x={labelX}
        y={y + 13}
        textAnchor={anchor}
        fontSize={12}
        fill="var(--color-text-muted)"
        className="max-md:hidden"
        aria-hidden
      >
        {health.headline && <tspan fontFamily="var(--font-mono)">{health.headline}</tspan>}
        {health.headline && ' · '}
        <tspan fill={display.textColor} fontWeight={600}>
          {display.word}
        </tspan>
      </text>
    </g>
  )
}
