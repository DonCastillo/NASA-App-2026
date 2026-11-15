type Props = {
  /** Show "BodyMap / CREW HEALTH" next to the mark */
  withWordmark?: boolean
  size?: number
}

// BodyMap logo: a body silhouette inside a thin orbit ring, with one cyan "pin" on the ring.
// See plan/branding.md, section 8. The same mark is used as public/favicon.svg.
export default function Logo({ withWordmark = true, size = 32 }: Props) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role="img"
        aria-label={withWordmark ? undefined : 'BodyMap'}
        aria-hidden={withWordmark ? true : undefined}
      >
        <circle
          cx="16"
          cy="16"
          r="13"
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth="1.2"
        />
        <circle cx="16" cy="10.5" r="2.6" fill="var(--color-text)" />
        <path
          d="M10.5 24c0-4.6 2.4-8 5.5-8s5.5 3.4 5.5 8"
          fill="none"
          stroke="var(--color-text)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="27.3" cy="9.5" r="2.6" fill="var(--color-accent)" />
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
