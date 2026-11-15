import { useParams } from 'react-router'
import PagePlaceholder from '../components/PagePlaceholder'

// One body system's status, guidance, indicators and trends. Route: /system/:id
export default function SystemDetail() {
  // :id is the system slug from the URL, e.g. "immune" in /system/immune
  const { id } = useParams()
  return (
    <PagePlaceholder title="System detail" phase="Phase 4">
      <p className="mt-4">
        System: <code className="reading text-accent">{id}</code>
      </p>
    </PagePlaceholder>
  )
}
