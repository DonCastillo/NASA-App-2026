import { X } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef } from 'react'

// A panel over the current page (plan/site-map.md → System detail): slides in from the right on
// desktop over a dimmed page, and fills the screen on phones. Closes with ✕, Esc or a click on the
// dimmed area. While open it takes focus and stops the page behind from scrolling.
type Props = {
  title: string
  /** Shown next to the title, e.g. a status chip */
  aside?: ReactNode
  onClose: () => void
  children: ReactNode
}

export default function SidePanel({ title, aside, onClose, children }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panelRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Dimmed page behind (desktop); clicking it closes the panel */}
      <div aria-hidden className="absolute inset-0 hidden bg-black/55 md:block" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="panel-slide-in relative flex h-full w-full flex-col border-space-700 bg-space-900 outline-none md:w-[480px] md:border-l md:shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
      >
        <header className="flex items-start gap-3 border-b border-space-700 px-5 py-4">
          <h2 id={titleId} className="min-w-0 flex-1 text-xl font-semibold text-text">
            {title}
          </h2>
          {aside}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-control border border-space-700 text-text transition-colors duration-150 hover:bg-space-800"
          >
            <X size={18} strokeWidth={1.5} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
