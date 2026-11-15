import { useId, useState } from 'react'
import { STATUS_DISPLAY } from '../../data/statusDisplay'
import { SYSTEMS } from '../../data/systems'
import type { Health } from '../../lib/health'
import type { SystemId } from '../../types'
import { BODY_PATH, CALLOUTS, ORGANS, type OrganShape, PIN_POSITIONS, VIEWBOX } from './geometry'
import Pin from './Pin'

// The body figure (plan/branding.md §5, plan/tasks.md 3.3): silhouette, organ hints lit by status,
// callout lines and 8 pins. Presentational: health comes in as a prop, opening a system is a callback.
// `highlighted` / `onHighlight` link it with the system list (hover a row → its pin, and back).

type Props = {
  health: Health
  onOpen: (systemId: SystemId) => void
  /** A system highlighted from outside, e.g. a hovered row in the system list */
  highlighted?: SystemId
  onHighlight?: (systemId: SystemId | undefined) => void
}

function Organ({ shape, ...style }: { shape: OrganShape; stroke: string; fill: string }) {
  switch (shape.kind) {
    case 'path':
      return (
        <path
          d={shape.d}
          strokeDasharray={shape.dashed ? '3 4' : undefined}
          fill="none"
          stroke={style.stroke}
        />
      )
    case 'ellipse':
      return (
        <ellipse
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          {...style}
          fillOpacity={0.35}
        />
      )
    case 'circle':
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...style} fillOpacity={0.45} />
  }
}

export default function BodyFigure({ health, onOpen, highlighted, onHighlight }: Props) {
  const [hovered, setHovered] = useState<SystemId>()
  const active = hovered ?? highlighted
  const tooltipId = useId()
  const gradientId = useId()
  const scanId = useId()

  const highlight = (systemId: SystemId, on: boolean) => {
    const next = on ? systemId : undefined
    setHovered(next)
    onHighlight?.(next)
  }

  const tooltipSystem = hovered ? SYSTEMS.find((s) => s.id === hovered) : undefined
  const tooltipHealth = hovered ? health.systems[hovered] : undefined

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        className="block h-auto w-full"
        role="group"
        aria-label="Body systems"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-accent)" stopOpacity={0.16} />
            <stop offset="1" stopColor="var(--color-accent)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id={scanId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--color-accent)" stopOpacity={0} />
            <stop offset="0.5" stopColor="var(--color-accent)" stopOpacity={0.9} />
            <stop offset="1" stopColor="var(--color-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Silhouette */}
        <path
          d={BODY_PATH}
          fill={`url(#${gradientId})`}
          stroke="var(--color-text-muted)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          aria-hidden
        />

        {/* Organ hints: faint by default, lit in amber/red, accent when highlighted */}
        {SYSTEMS.map((system) => {
          const shapes = ORGANS[system.id]
          if (!shapes) return null
          const { status } = health.systems[system.id]
          const lit = status === 'amber' || status === 'red'
          const isActive = active === system.id
          const color = isActive
            ? 'var(--color-accent)'
            : lit
              ? STATUS_DISPLAY[status].color
              : 'var(--color-text-muted)'
          return (
            <g
              key={system.id}
              data-organ={system.id}
              opacity={isActive || lit ? 0.95 : 0.35}
              strokeWidth={1.3}
              className="transition-opacity duration-250"
              style={
                isActive ? { filter: 'drop-shadow(0 0 4px rgb(56 189 248 / 0.7))' } : undefined
              }
              aria-hidden
            >
              {shapes.map((shape, i) => (
                <Organ
                  key={i}
                  shape={shape}
                  stroke={color}
                  fill={lit || isActive ? color : 'none'}
                />
              ))}
            </g>
          )
        })}

        {/* Callout lines and their end dots */}
        {SYSTEMS.map((system) => {
          const callout = CALLOUTS[system.id]
          return (
            <g key={system.id} aria-hidden>
              <path
                d={callout.d}
                fill="none"
                stroke={active === system.id ? 'var(--color-accent)' : 'var(--color-space-700)'}
                strokeWidth={1}
                strokeDasharray={callout.dashed ? '3 4' : undefined}
                className="transition-[stroke] duration-150"
              />
              <circle
                cx={callout.anchor.x}
                cy={callout.anchor.y}
                r={2.5}
                fill="var(--color-text-muted)"
              />
            </g>
          )
        })}

        {/* Pins */}
        {SYSTEMS.map((system) => (
          <Pin
            key={system.id}
            system={system}
            health={health.systems[system.id]}
            position={PIN_POSITIONS[system.id]}
            gaugePercent={system.id === 'radiation' ? health.dose.percentOfBudget : undefined}
            highlighted={active === system.id}
            dimmed={active !== undefined && active !== system.id}
            tooltipId={hovered === system.id ? tooltipId : undefined}
            onHighlight={(on) => highlight(system.id, on)}
            onOpen={() => onOpen(system.id)}
          />
        ))}

        {/* One soft scan line sweeps down the body on load (skipped with reduced motion) */}
        <rect
          x={185}
          y={20}
          width={230}
          height={2}
          fill={`url(#${scanId})`}
          className="body-scan"
          aria-hidden
        />
      </svg>

      {/* Hover / focus tooltip, positioned over the pin */}
      {tooltipSystem && tooltipHealth && (
        <div
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 rounded-control border border-space-700 bg-space-900 px-3 py-2 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          style={{
            left: `${(PIN_POSITIONS[tooltipSystem.id].x / VIEWBOX.width) * 100}%`,
            top: `${((PIN_POSITIONS[tooltipSystem.id].y + 30) / VIEWBOX.height) * 100}%`,
          }}
        >
          <span className="font-semibold text-text">{tooltipSystem.name}</span>
          {' · '}
          <span
            style={{ color: STATUS_DISPLAY[tooltipHealth.status].textColor }}
            className="font-semibold"
          >
            {STATUS_DISPLAY[tooltipHealth.status].icon} {STATUS_DISPLAY[tooltipHealth.status].word}
          </span>
          <span className="mt-0.5 block text-text-muted">{tooltipHealth.reason}</span>
        </div>
      )}
    </div>
  )
}
