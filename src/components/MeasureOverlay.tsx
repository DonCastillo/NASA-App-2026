import { SYSTEMS } from '../data/systems'
import type { Indicator } from '../types'
import MeasureSteps from './MeasureSteps'
import Modal from './Modal'

// Overlay C — How to measure (plan/site-map.md → Overlays): steps, a common mistake, and why the
// measurement matters in space, for one indicator. Content comes from src/data/systems/*.ts.
export default function MeasureOverlay({
  indicator,
  onClose,
}: {
  indicator: Indicator
  onClose: () => void
}) {
  const system = SYSTEMS.find((s) => s.indicators.some((i) => i.id === indicator.id))
  return (
    <Modal eyebrow="How to measure" title={indicator.name} onClose={onClose}>
      <div className="flex flex-col gap-4 text-sm">
        <MeasureSteps indicator={indicator} />
        {indicator.commonMistake && (
          <p className="text-text-muted">
            <span className="font-semibold text-text">Common mistake:</span>{' '}
            {indicator.commonMistake}
          </p>
        )}
        {system && (
          <div className="rounded-control bg-space-800 px-3 py-2.5">
            <p className="text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
              Why it matters in space
            </p>
            <p className="mt-1 text-text">{system.whyInSpace[0]}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
