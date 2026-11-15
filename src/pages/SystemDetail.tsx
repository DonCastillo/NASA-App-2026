import { useCallback } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import Guidance from '../components/detail/Guidance'
import IndicatorCards from '../components/detail/IndicatorCards'
import SidePanel from '../components/SidePanel'
import StatusChip from '../components/StatusChip'
import { SYSTEMS } from '../data/systems'
import { selectHealth, selectMission } from '../state/selectors'
import { useAppStore } from '../state/useAppStore'

// System detail (plan/site-map.md → System detail). Route: /system/:id
// A child route of the Body Map, so the map stays visible behind the panel on desktop.
// Order: status → what to do → evidence (4.3–4.4) → background (4.5).
export default function SystemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const health = useAppStore(selectHealth)
  const mission = useAppStore(selectMission)
  const today = useAppStore((s) => s.today)
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

      <p className="px-5 py-4 text-sm text-text-muted">
        Trends and background come in the next steps.
      </p>
    </SidePanel>
  )
}
