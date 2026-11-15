import { Lightbulb, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { HINTS, type HintId } from '../../data/onboarding'
import { useAppStore } from '../../state/useAppStore'

// A first-time hint (plan/tasks.md 7.4): shown the first time a screen opens, then never again.
// It stays for that visit (until dismissed) even though it is marked as seen straight away.
export default function FirstTimeHint({ id }: { id: HintId }) {
  const seen = useAppStore((s) => s.stored.settings.hintsSeen.includes(id))
  const markHintSeen = useAppStore((s) => s.markHintSeen)
  const [show, setShow] = useState(!seen)

  useEffect(() => {
    if (show) markHintSeen(id)
  }, [show, id, markHintSeen])

  if (!show) return null
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-control border border-accent/40 bg-accent/8 px-3 py-2 text-[13px] text-text"
    >
      <Lightbulb size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      <span className="flex-1">{HINTS[id]}</span>
      <button
        type="button"
        aria-label="Dismiss hint"
        onClick={() => setShow(false)}
        className="-my-1 grid size-7 shrink-0 place-items-center rounded-control text-text-muted hover:bg-space-800 hover:text-text"
      >
        <X size={14} strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  )
}
