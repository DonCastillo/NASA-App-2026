import { useState } from 'react'
import NumberStepper from './NumberStepper'

// Two numbers, e.g. blood pressure: top (systolic) and bottom (diastolic).
// The pair is only reported once both numbers are set, so the half-entered pair is kept here.
// If `value` changes from outside to something else (e.g. "Same as yesterday"), that value is shown.
type Pair = [number | undefined, number | undefined]

type Props = {
  value: [number, number] | undefined
  onChange: (value: [number, number] | undefined) => void
  unit?: string
  labels: [string, string]
  hint?: string
}

const samePair = (a: Pair, b: [number, number]) => a[0] === b[0] && a[1] === b[1]

export default function PairStepper({ value, onChange, unit, labels, hint }: Props) {
  const [parts, setParts] = useState<Pair>()
  const shown: Pair =
    parts && (value === undefined || samePair(parts, value))
      ? parts
      : (value ?? [undefined, undefined])

  const set = (index: 0 | 1, part: number | undefined) => {
    const next: Pair = [...shown]
    next[index] = part
    setParts(next)
    onChange(next[0] !== undefined && next[1] !== undefined ? [next[0], next[1]] : undefined)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {([0, 1] as const).map((index) => (
        <div key={index} className="flex flex-col items-center gap-1">
          <span className="text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
            {labels[index]}
          </span>
          <NumberStepper
            value={shown[index]}
            onChange={(part) => set(index, part)}
            unit={unit}
            label={labels[index]}
            size="small"
          />
        </div>
      ))}
      {hint && <p className="text-[13px] text-text-muted">{hint}</p>}
    </div>
  )
}
