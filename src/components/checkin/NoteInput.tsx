// The optional free-text note at the end of a check-in (context for the CMO or flight surgeons).
type Props = { value: string | undefined; onChange: (value: string) => void; label: string }

export const NOTE_MAX_LENGTH = 500

export default function NoteInput({ value = '', onChange, label }: Props) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="sr-only">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, NOTE_MAX_LENGTH))}
        rows={4}
        maxLength={NOTE_MAX_LENGTH}
        placeholder="e.g. Headache started after the EVA prep"
        className="w-full resize-none rounded-control border border-space-700 bg-space-800 px-3 py-2.5 text-[15px] text-text outline-none placeholder:text-text-muted focus:border-accent focus:shadow-[0_0_0_2px_rgb(56_189_248/0.35)]"
      />
      <span className="self-end text-xs text-text-muted">
        {value.length}/{NOTE_MAX_LENGTH}
      </span>
    </label>
  )
}
