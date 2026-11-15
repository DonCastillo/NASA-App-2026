import { useEffect, useId, useRef, useState } from 'react'
import { TOUR_STEPS } from '../../data/onboarding'
import { type Rect, highlightBox, tooltipPlacement } from '../../lib/tour'
import { useFocusTrap } from '../useFocusTrap'

// Overlay D — Guided tour (plan/site-map.md → Overlays, plan/tasks.md 7.3). The page dims, one
// element is highlighted at a time (found by its data-tour attribute), and a tooltip explains it.
// Esc skips; Enter (on the focused Next button) goes on. A small custom component, no library.

/** The first visible element with this data-tour value (the header has a phone and a desktop copy) */
function findTarget(name: string): Rect | undefined {
  for (const el of document.querySelectorAll(`[data-tour="${name}"]`)) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) {
      return { top: r.top, left: r.left, width: r.width, height: r.height }
    }
  }
  return undefined
}

const DIM = 'color-mix(in srgb, var(--color-space-950) 72%, transparent)'

export default function GuidedTour({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const [layout, setLayout] = useState<{ target?: Rect; width: number; height: number }>()
  const step = TOUR_STEPS[index]
  const isLast = index === TOUR_STEPS.length - 1
  const dialogRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const textId = useId()
  useFocusTrap(dialogRef)

  // Bring the step's element into view and measure it; again on resize and scroll
  useEffect(() => {
    document.querySelector(`[data-tour="${step.target}"]`)?.scrollIntoView?.({ block: 'center' })
    const measure = () =>
      setLayout({ target: findTarget(step.target), width: innerWidth, height: innerHeight })
    const frame = requestAnimationFrame(measure)
    addEventListener('resize', measure)
    addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('resize', measure)
      removeEventListener('scroll', measure, true)
    }
  }, [step.target])

  useEffect(() => {
    nextRef.current?.focus()
  }, [index])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDone()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onDone])

  const next = () => (isLast ? onDone() : setIndex(index + 1))
  const viewport = { width: layout?.width ?? innerWidth, height: layout?.height ?? innerHeight }
  const target = layout?.target
  const box = target && highlightBox(target)
  const placed = tooltipPlacement(target, viewport)

  return (
    <div className="fixed inset-0 z-[60]">
      {box ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-control ring-2 ring-accent transition-all duration-250"
          style={{ ...box, boxShadow: `0 0 0 9999px ${DIM}` }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0" style={{ background: DIM }} />
      )}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        className="absolute flex flex-col gap-3 rounded-panel border border-space-700 bg-space-900 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
        style={{ left: placed.left, width: placed.width, top: placed.top, bottom: placed.bottom }}
      >
        <div aria-live="polite" className="flex flex-col gap-1">
          <h2 id={titleId} className="text-[15px] font-semibold text-text">
            {step.title}
          </h2>
          <p id={textId} className="text-sm text-text-muted">
            {step.text}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="reading flex-1 text-xs text-text-muted">
            {index + 1} of {TOUR_STEPS.length}
          </span>
          <button
            type="button"
            onClick={onDone}
            className="h-9 rounded-control px-3 text-sm font-medium text-text-muted hover:bg-space-800 hover:text-text"
          >
            Skip tour
          </button>
          <button
            ref={nextRef}
            type="button"
            onClick={next}
            className="h-9 rounded-control bg-accent px-4 text-sm font-semibold text-space-950 hover:bg-accent-hover"
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
