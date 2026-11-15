import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { DEMO_IDS } from '../../state/appStore'
import { useAppStore } from '../../state/useAppStore'
import GuidedTour from './GuidedTour'
import WelcomeOverlay from './WelcomeOverlay'

// First visit (plan/tasks.md 7.2–7.3): Welcome, then the guided tour, both on the Body Map only.
// Each is shown once (flags in storage) and can be replayed from About.
export default function Onboarding() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.stored.settings)
  const selectedProfileId = useAppStore((s) => s.selectedProfileId)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const selectProfile = useAppStore((s) => s.selectProfile)

  // The tour uses the demo crew, whose pins show real colors, including amber and red
  const explore = useCallback(() => {
    if (!DEMO_IDS.includes(selectedProfileId)) selectProfile(DEMO_IDS[0])
    updateSettings({ welcomeSeen: true })
  }, [selectedProfileId, selectProfile, updateSettings])

  const setUp = useCallback(() => {
    updateSettings({ welcomeSeen: true, tourSeen: true })
    navigate('/setup?new=1')
  }, [navigate, updateSettings])

  const endTour = useCallback(() => updateSettings({ tourSeen: true }), [updateSettings])

  if (pathname !== '/') return null
  if (!settings.welcomeSeen) return <WelcomeOverlay onExplore={explore} onSetUp={setUp} />
  if (!settings.tourSeen) return <GuidedTour onDone={endTour} />
  return null
}
