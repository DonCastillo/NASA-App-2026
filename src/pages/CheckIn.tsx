import { useSearchParams } from 'react-router'
import PagePlaceholder from '../components/PagePlaceholder'

// Guided check-in. Route: /check-in, /check-in?system=eyes, /check-in?task=vision-weekly
export default function CheckIn() {
  // The query string decides which questions are asked (full daily, one system, or one task)
  const [params] = useSearchParams()
  const system = params.get('system')
  const task = params.get('task')
  const mode = system ? `system: ${system}` : task ? `task: ${task}` : 'daily'
  return (
    <PagePlaceholder title="Check-in" phase="Phase 5">
      <p className="mt-4">
        Mode: <code className="font-mono text-sky-400">{mode}</code>
      </p>
    </PagePlaceholder>
  )
}
