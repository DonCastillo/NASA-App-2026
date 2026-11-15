// Big tap targets for single-choice answers (plan/branding.md §6 → Scale buttons): yes/no,
// severity 0–3, rating 1–5 and countermeasure answers. Tapping an option answers and moves on.
export type Choice<T> = { value: T; label: string; face?: string }

type Props<T> = {
  choices: Choice<T>[]
  value: T | undefined
  /** Called with the chosen value; the page moves to the next question */
  onAnswer: (value: T) => void
  /** Screen-reader name of the group, e.g. the question */
  label: string
  /** Lay the options out in this many columns (default: one row) */
  columns?: number
}

export default function ChoiceButtons<T extends string | number | boolean>({
  choices,
  value,
  onAnswer,
  label,
  columns,
}: Props<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns ?? choices.length}, minmax(0, 1fr))` }}
    >
      {choices.map((choice) => {
        const selected = value === choice.value
        return (
          <button
            key={String(choice.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onAnswer(choice.value)}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-control border px-2 py-2 text-[13px] font-medium text-text transition-colors duration-150 ${
              selected
                ? 'border-accent bg-accent/12'
                : 'border-space-700 bg-space-800 hover:border-text-muted'
            }`}
          >
            {choice.face && (
              <span aria-hidden className="text-2xl leading-none">
                {choice.face}
              </span>
            )}
            {choice.label}
          </button>
        )
      })}
    </div>
  )
}
