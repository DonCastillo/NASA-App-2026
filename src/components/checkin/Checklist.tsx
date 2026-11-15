import { Check } from 'lucide-react'

// Pick any number of options (immune symptoms, the symptom tap list). "None of these" clears them.
type Props = {
  options: { id: string; label: string }[]
  value: string[] | undefined
  onChange: (value: string[]) => void
  label: string
}

export default function Checklist({ options, value = [], onChange, label }: Props) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  const item = (selected: boolean) =>
    `flex min-h-11 items-center gap-2.5 rounded-control border px-3 py-2 text-left text-sm text-text transition-colors duration-150 ${
      selected
        ? 'border-accent bg-accent/12'
        : 'border-space-700 bg-space-800 hover:border-text-muted'
    }`

  return (
    <div role="group" aria-label={label} className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const selected = value.includes(option.id)
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(option.id)}
            className={item(selected)}
          >
            <span
              aria-hidden
              className={`grid size-5 shrink-0 place-items-center rounded-[5px] border ${
                selected ? 'border-accent bg-accent text-space-950' : 'border-text-muted'
              }`}
            >
              {selected && <Check size={14} strokeWidth={2.5} />}
            </span>
            {option.label}
          </button>
        )
      })}
      <button
        type="button"
        aria-pressed={value.length === 0}
        onClick={() => onChange([])}
        className={`${item(false)} justify-center text-text-muted sm:col-span-2`}
      >
        None of these
      </button>
    </div>
  )
}
