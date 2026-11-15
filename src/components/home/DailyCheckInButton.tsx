import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'

// The daily check-in call to action (plan/site-map.md → Body Map). Before today's check-in: a
// prominent button. After it: a short "done" note with a way to check in again (e.g. a recheck),
// so the check-in is always one tap away (also for the demo crew, whose seed includes today).
export default function DailyCheckInButton({ done }: { done: boolean }) {
  if (!done) {
    return (
      <Link
        to="/check-in"
        data-tour="daily-check-in"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-control bg-accent px-4 text-[15px] font-semibold text-space-950 transition-colors duration-150 hover:bg-accent-hover"
      >
        Start daily check-in <span className="reading font-normal">~2 min</span>
      </Link>
    )
  }
  return (
    <div
      data-tour="daily-check-in"
      className="flex items-center justify-between gap-3 rounded-control border border-space-700 px-3.5 py-2.5 text-sm"
    >
      <span className="flex items-center gap-2 text-text-muted">
        <CheckCircle2 size={18} strokeWidth={1.5} className="text-ok" aria-hidden />
        Today’s check-in is done
      </span>
      <Link to="/check-in" className="font-medium text-accent underline-offset-2 hover:underline">
        Check in again
      </Link>
    </div>
  )
}
