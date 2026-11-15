import { useState } from 'react'
import { useNavigate } from 'react-router'
import BodyFigure from '../components/body/BodyFigure'
import SystemList from '../components/SystemList'
import { selectHealth } from '../state/selectors'
import { useAppStore } from '../state/useAppStore'
import type { SystemId } from '../types'

// Home page (plan/site-map.md → Body Map): body figure and system list, linked by one shared
// highlight. Side by side on wide screens, list below the figure otherwise. Extras come in 3.5.
export default function BodyMap() {
  const health = useAppStore(selectHealth)
  const navigate = useNavigate()
  const [highlighted, setHighlighted] = useState<SystemId>()

  return (
    <section className="p-4 md:p-8">
      <h1 className="sr-only">Body Map</h1>
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-panel border border-space-700 bg-space-950 p-3">
          <BodyFigure
            health={health}
            onOpen={(systemId) => navigate(`/system/${systemId}`)}
            highlighted={highlighted}
            onHighlight={setHighlighted}
          />
        </div>
        <div className="rounded-panel border border-space-700 bg-space-900 p-3">
          <h2 className="px-3 pt-1 pb-2 text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
            Systems
          </h2>
          <SystemList health={health} highlighted={highlighted} onHighlight={setHighlighted} />
        </div>
      </div>
    </section>
  )
}
