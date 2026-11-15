import { useCallback } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import Background from '../components/detail/Background'
import Guidance from '../components/detail/Guidance'
import IndicatorCards from '../components/detail/IndicatorCards'
import Trends from '../components/detail/Trends'
import SidePanel from '../components/SidePanel'
import StatusChip from '../components/StatusChip'
import { SYSTEMS } from '../data/systems'
import { selectDataset, selectHealth, selectMission } from '../state/selectors'
import { useAppStore } from '../state/useAppStore'

// System detail (plan/site-map.md → System detail). Route: /system/:id
// A child route of the Body Map, so the map stays visible behind the panel on desktop.
// Order: status → what to do → evidence (cards, trends) → background → check this system now.
export default function SystemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const health = useAppStore(selectHealth)
  const mission = useAppStore(selectMission)
  const today = useAppStore((s) => s.today)
  const dataset = useAppStore(selectDataset)
  const system = SYSTEMS.find((s) => s.id === id)

  // Back to where the user came from; if the panel was opened directly (refresh, shared link),
  // there is no in-app history, so go to the Body Map instead of leaving the app
  const close = useCallback(() => {
    if (location.key === 'default') navigate('/', { replace: true })
    else navigate(-1)
  }, [location.key, navigate])

  if (!system) return <Navigate to="/" replace />
  const systemHealth = health.systems[system.id]

  return (
    <SidePanel
      title={system.name}
      aside={<StatusChip status={systemHealth.status} />}
      onClose={close}
    >
      {/* 1. Status: one plain sentence on why */}
      <p className="border-b border-space-700 px-5 py-3 text-sm text-text-muted">
        {systemHealth.reason}
      </p>

      {/* 2. What to do now + escalation for the mission */}
      <div className="border-b border-space-700">
        <Guidance
          system={system}
          status={systemHealth.status}
          mission={mission}
          commsDelaySeconds={health.commsDelaySeconds}
        />
      </div>

      {/* 3. Indicator cards (amber and red first) */}
      <div className="border-b border-space-700">
        <IndicatorCards system={system} health={health} today={today} />
      </div>

      {/* 4. Trends */}
      <div className="border-b border-space-700">
        <Trends system={system} health={health} dataset={dataset} today={today} />
      </div>

      {/* 5–7. Background, collapsed: why it changes in space, how to measure, sources */}
      <Background system={system} />

      {/* 8. Recheck this system */}
      <div className="p-5">
        <Link
          to={`/check-in?system=${system.id}`}
          className="flex h-11 w-full items-center justify-center rounded-control border border-space-700 text-[15px] font-semibold text-text transition-colors duration-150 hover:bg-space-800"
        >
          Check this system now
        </Link>
      </div>
    </SidePanel>
  )
}
