import { Minus, Plus } from 'lucide-react'
import { useId, useState } from 'react'

// A number input with −/+ buttons (plan/site-map.md → Check-in → Question screen).
// Controlled: shows `value`, reports changes. Typing is allowed; −/+ move by `step`.
// While typing, the text can be briefly unfinished ("37."), so the typed text is kept as a draft
// together with the value it stands for. If `value` changes from outside (e.g. "Same as yesterday"),
// the draft no longer matches and the new value is shown instead — no effect needed.
type Props = {
  value: number | undefined
  onChange: (value: number | undefined) => void
  step?: number
  unit?: string
  /** Screen-reader name, e.g. "Body temperature" */
  label: string
  /** Shown under the value, e.g. "yesterday: 36.6" */
  hint?: string
  size?: 'large' | 'small'
}

const decimalsOf = (step: number) =>
  Number.isInteger(step) ? 0 : String(step).split('.')[1].length

export default function NumberStepper({
  value,
  onChange,
  step = 1,
  unit,
  label,
  hint,
  size = 'large',
}: Props) {
  const decimals = decimalsOf(step)
  const unitId = useId()
  const [draft, setDraft] = useState<{ text: string; forValue: number | undefined }>()
  const text =
    draft && draft.forValue === value
      ? draft.text
      : value === undefined
        ? ''
        : value.toFixed(decimals)

  const nudge = (direction: 1 | -1) => {
    const next = Math.round(((value ?? 0) + direction * step) * 10 ** decimals) / 10 ** decimals
    setDraft(undefined)
    onChange(next)
  }

  const onType = (raw: string) => {
    const cleaned = raw.replace(',', '.').replace(/[^\d.-]/g, '')
    const parsed = Number(cleaned)
    const next = cleaned === '' || Number.isNaN(parsed) ? undefined : parsed
    setDraft({ text: cleaned, forValue: next })
    onChange(next)
  }

  const button =
    'grid shrink-0 place-items-center rounded-control border border-space-700 bg-space-800 text-text transition-colors duration-150 hover:border-text-muted ' +
    (size === 'large' ? 'size-12' : 'size-10')

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => nudge(-1)}
          className={button}
        >
          <Minus size={20} strokeWidth={1.5} aria-hidden />
        </button>
        <div className="flex items-baseline gap-1.5">
          <input
            type="text"
            inputMode="decimal"
            aria-label={label}
            aria-describedby={unit ? unitId : undefined}
            value={text}
            onChange={(e) => onType(e.target.value)}
            placeholder="–"
            className={`reading w-[5.5ch] border-b-2 border-transparent bg-transparent text-center text-text outline-none placeholder:text-text-muted focus:border-accent ${
              size === 'large' ? 'text-4xl' : 'text-2xl'
            }`}
          />
          {unit && (
            <span id={unitId} className="text-sm text-text-muted">
              {unit}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => nudge(1)}
          className={button}
        >
          <Plus size={20} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
      {hint && <p className="text-[13px] text-text-muted">{hint}</p>}
    </div>
  )
}
