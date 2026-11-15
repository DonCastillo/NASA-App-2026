import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import BodyFigure from '../components/body/BodyFigure'
import AlertsStrip from '../components/home/AlertsStrip'
import DailyCheckInButton from '../components/home/DailyCheckInButton'
import ReadinessSummary from '../components/home/ReadinessSummary'
import SystemList from '../components/SystemList'
import { selectHealth } from '../state/selectors'
import { useAppStore } from '../state/useAppStore'
import type { SystemId } from '../types'

// Home page (plan/site-map.md → Body Map). Answers "How am I doing?" at a glance:
//   readiness summary + alerts (first, also on phones) → body figure and system list, linked by one
//   shared highlight (side by side on wide screens) → daily check-in button under the list.
export default function BodyMap() {
  const health = useAppStore(selectHealth)
  const navigate = useNavigate()
  const [highlighted, setHighlighted] = useState<SystemId>()

  return (
    <section className="p-4 md:p-8">
      <h1 className="sr-only">Body Map</h1>
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <ReadinessSummary health={health} />
        <AlertsStrip health={health} />

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-panel border border-space-700 bg-space-950 p-3">
            <BodyFigure
              health={health}
              onOpen={(systemId) => navigate(`/system/${systemId}`)}
              highlighted={highlighted}
              onHighlight={setHighlighted}
            />
          </div>
          <div className="flex flex-col gap-3 rounded-panel border border-space-700 bg-space-900 p-3">
            <h2 className="px-3 pt-1 text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
              Systems
            </h2>
            <SystemList health={health} highlighted={highlighted} onHighlight={setHighlighted} />
            <div className="mt-auto px-1 pb-1">
              <DailyCheckInButton done={health.checkInDoneToday} />
            </div>
          </div>
        </div>
      </div>
      {/* System detail opens here as a panel (route /system/:id) */}
      <Outlet />
    </section>
  )
}
