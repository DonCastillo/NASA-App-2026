import { ChevronDown } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { useFocusTrap } from './useFocusTrap'

// A small dropdown menu: a button that opens a panel of items.
// Closes on outside click, Esc (focus returns to the button), or when an item calls close().
// While open, Tab cycles between the button and the items.
type Props = {
  /** What the button shows, e.g. the selected crew member's name */
  label: ReactNode
  /** Screen-reader name for the button, e.g. "Crew member: Cmdr. Vega" */
  ariaLabel: string
  /** Panel contents; call close() after choosing an item */
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  className?: string
  /** Replaces the default button style (e.g. the 🔔 icon button) */
  buttonClassName?: string
  /** Show the ▾ chevron after the label (default true) */
  chevron?: boolean
}

const BUTTON_CLASS =
  'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-control border border-space-700 px-3 text-sm text-text transition-colors duration-150 hover:bg-space-800'

export default function Menu({
  label,
  ariaLabel,
  children,
  align = 'left',
  className = '',
  buttonClassName = BUTTON_CLASS,
  chevron = true,
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  // When the menu closes, focus goes back to its button, except after a click outside the menu
  const wasOpenRef = useRef(false)
  const skipFocusRef = useRef(false)
  const panelId = useId()
  useFocusTrap(rootRef, open)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        skipFocusRef.current = true
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (wasOpenRef.current && !open && !skipFocusRef.current) buttonRef.current?.focus()
    wasOpenRef.current = open
    skipFocusRef.current = false
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={buttonClassName}
      >
        {label}
        {chevron && <ChevronDown size={16} strokeWidth={1.5} aria-hidden />}
      </button>
      {open && (
        <div
          id={panelId}
          role="menu"
          className={`absolute top-11 z-30 w-72 rounded-panel border border-space-700 bg-space-900 p-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}

/** One choosable item in a menu */
export function MenuItem({
  children,
  onSelect,
  checked,
}: {
  children: ReactNode
  onSelect: () => void
  /** For single-choice items (crew member, mission): shows a check and sets aria-checked */
  checked?: boolean
}) {
  return (
    <button
      type="button"
      role={checked === undefined ? 'menuitem' : 'menuitemradio'}
      aria-checked={checked}
      onClick={onSelect}
      className="flex w-full items-start gap-2 rounded-control px-3 py-2 text-left text-sm text-text hover:bg-space-800"
    >
      {checked !== undefined && (
        <span aria-hidden className="w-4 shrink-0 text-accent">
          {checked ? '✓' : ''}
        </span>
      )}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
      {children}
    </p>
  )
}

export function MenuDivider() {
  return <div role="separator" className="my-1 h-px bg-space-700" />
}
