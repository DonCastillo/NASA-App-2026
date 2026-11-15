import { X } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef } from 'react'
import { useFocusTrap } from './useFocusTrap'

// A centered overlay (plan/site-map.md → Overlays): dimmed backdrop, soft shadow.
// Closes with ✕, Esc or a click on the backdrop. Takes focus when it opens and gives it back to
// whatever opened it when it closes. Tab stays inside while it is open.
type Props = {
  title: string
  /** Small label above the title, e.g. "How to measure" */
  eyebrow?: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ title, eyebrow, onClose, children }: Props) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(dialogRef)

  // Take focus when opened; give it back to the opener when closed
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => opener?.focus?.()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div aria-hidden className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="panel-slide-in relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-panel border border-space-700 bg-space-900 shadow-[0_24px_60px_rgba(0,0,0,0.55)] outline-none"
      >
        <header className="flex items-start gap-3 px-5 pt-4 pb-2">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
                {eyebrow}
              </p>
            )}
            <h2 id={titleId} className="text-lg font-semibold text-text">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-control border border-space-700 text-text hover:bg-space-800"
          >
            <X size={18} strokeWidth={1.5} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  )
}
