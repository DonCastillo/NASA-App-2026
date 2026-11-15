import { STATUS_DISPLAY } from '../data/statusDisplay'
import type { Status } from '../types'

// A status pill (plan/branding.md §6): 15% tint of the status color, with icon and word —
// never color alone. Used in System detail and anywhere a status is shown as text.
export default function StatusChip({ status }: { status: Status }) {
  const display = STATUS_DISPLAY[status]
  return (
    <span
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap"
      style={{
        color: display.textColor,
        background: `color-mix(in srgb, ${display.color} 15%, transparent)`,
      }}
    >
      <span aria-hidden>{display.icon}</span>
      {display.word}
    </span>
  )
}
