import { useCallback } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import SidePanel from '../components/SidePanel'
import { SYSTEMS } from '../data/systems'

// System detail (plan/site-map.md → System detail, plan/tasks.md 4.1). Route: /system/:id
// A child route of the Body Map, so the map stays visible behind the panel on desktop.
// Contents (status, guidance, indicators, trends, background) are filled in 4.2–4.5.
export default function SystemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const system = SYSTEMS.find((s) => s.id === id)

  // Back to where the user came from; if the panel was opened directly (refresh, shared link),
  // there is no in-app history, so go to the Body Map instead of leaving the app
  const close = useCallback(() => {
    if (location.key === 'default') navigate('/', { replace: true })
    else navigate(-1)
  }, [location.key, navigate])

  if (!system) return <Navigate to="/" replace />

  return (
    <SidePanel title={system.name} onClose={close}>
      <div className="p-5 text-sm text-text-muted">
        <p>{system.whatItDoes}</p>
        <p className="mt-4">Status, guidance, indicators and trends come in the next steps.</p>
      </div>
    </SidePanel>
  )
}
