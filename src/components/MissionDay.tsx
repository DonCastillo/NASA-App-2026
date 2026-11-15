import { formatDelay } from '../lib/format'
import { selectHealth } from '../state/selectors'
import { useAppStore } from '../state/useAppStore'

// "Day 150/210 · 14 min delay" with a progress bar (plan/site-map.md → Body Map → Header)
export default function MissionDay() {
  const { progress, commsDelaySeconds } = useAppStore(selectHealth)
  const day = Math.max(0, Math.min(progress.day, progress.lengthDays))

  return (
    <div className="flex min-w-[9.5rem] flex-col gap-1 text-[13px]">
      <span>
        <span className="reading">
          Day {day}/{progress.lengthDays}
        </span>
        <span className="text-text-muted">
          {' · '}
          <span className="reading">{formatDelay(commsDelaySeconds)}</span> delay
        </span>
      </span>
      <div
        role="progressbar"
        aria-label="Mission progress"
        aria-valuemin={0}
        aria-valuemax={progress.lengthDays}
        aria-valuenow={day}
        className="h-1 overflow-hidden rounded-full bg-space-700"
      >
        <div className="h-full bg-accent" style={{ width: `${progress.progress * 100}%` }} />
      </div>
    </div>
  )
}
