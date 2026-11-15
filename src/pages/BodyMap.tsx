import { useNavigate } from 'react-router'
import BodyFigure from '../components/body/BodyFigure'
import { selectHealth } from '../state/selectors'
import { useAppStore } from '../state/useAppStore'

// Home page: body figure (3.3), then the system list (3.4) and home extras (3.5).
export default function BodyMap() {
  const health = useAppStore(selectHealth)
  const navigate = useNavigate()

  return (
    <section className="p-4 md:p-8">
      <h1 className="sr-only">Body Map</h1>
      <div className="mx-auto max-w-3xl rounded-panel border border-space-700 bg-space-950 p-3">
        <BodyFigure health={health} onOpen={(systemId) => navigate(`/system/${systemId}`)} />
      </div>
    </section>
  )
}
