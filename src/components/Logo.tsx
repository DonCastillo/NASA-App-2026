import { useEffect, useState } from 'react'
import { LOGO_FIGURE_PATH } from './logoFigurePath'

type Props = {
  /** Show "BodyMap / CREW HEALTH" next to the mark */
  withWordmark?: boolean
  size?: number
  /** Move the cyan pin along the tilted orbit (header only). Off when the user prefers reduced motion. */
  animated?: boolean
}

// The tilted orbit: an ellipse (rx 15, ry 5.6) around the logo center, rotated −25°.
// Drawn as two arcs so the pin can follow it with <animateMotion>.
const ORBIT_PATH = 'M31 16 A15 5.6 0 1 1 1 16 A15 5.6 0 1 1 31 16'
// Resting pin position on the orbit (20° above its right end), used when not animated
const PIN_REST = { cx: 30.1, cy: 14.08 }

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia?.(query)
    if (!mql) return
    const onChange = () => setReduced(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// BodyMap logo: the body-diagram silhouette inside a thin ring, with a tilted cyan orbit
// passing behind the body and a cyan "pin" travelling on it. See plan/branding.md §8.
// The static version of the same mark is public/favicon.svg.
export default function Logo({ withWordmark = true, size = 32, animated = false }: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const moving = animated && !reducedMotion

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        overflow="visible"
        role="img"
        aria-label={withWordmark ? undefined : 'BodyMap'}
        aria-hidden={withWordmark ? true : undefined}
      >
        <circle
          cx="16"
          cy="16"
          r="12"
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth="1.2"
        />
        <g transform="rotate(-25 16 16)">
          {/* Orbit and pin are drawn first, so the body covers them: the orbit passes behind */}
          <path
            d={ORBIT_PATH}
            fill="none"
            stroke="var(--color-accent)"
            strokeOpacity="0.7"
            strokeWidth="1"
          />
          {moving ? (
            <circle r="2.4" fill="var(--color-accent)" data-testid="logo-pin-moving">
              <animateMotion dur="6s" repeatCount="indefinite" path={ORBIT_PATH} />
            </circle>
          ) : (
            <circle {...PIN_REST} r="2.4" fill="var(--color-accent)" />
          )}
        </g>
        {/* Body, slightly smaller, with a background-colored edge so the orbit looks like it passes behind */}
        <g transform="translate(16 16) scale(0.92) translate(-16 -16)">
          <path
            d={LOGO_FIGURE_PATH}
            fill="var(--color-text)"
            stroke="var(--color-space-900)"
            strokeWidth="1.6"
            paintOrder="stroke"
          />
        </g>
      </svg>
      {withWordmark && (
        <span className="leading-tight">
          <span className="block text-base font-semibold text-text">BodyMap</span>
          <span className="block text-[10px] tracking-[0.14em] text-text-muted">CREW HEALTH</span>
        </span>
      )}
    </span>
  )
}
