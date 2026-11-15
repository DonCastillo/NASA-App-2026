import { Bell } from 'lucide-react'
import { Link } from 'react-router'
import { bellTone, nextDailyLabel, taskDisplay } from '../lib/scheduler'
import { useTasks } from '../state/useTasks'
import Menu, { MenuDivider } from './Menu'
import { TONE_TEXT } from './taskTone'

// The 🔔 notification dropdown in the header (plan/site-map.md → Notification bell, tasks.md 6.2).
// Lists pending tasks in priority order; tapping one opens its check-in. Suggestions only.

const BADGE_BG = { alert: 'bg-alert', warn: 'bg-warn', accent: 'bg-accent' }

export default function BellMenu() {
  const { pending, input } = useTasks()
  const now = input.now
  const tone = bellTone(pending)
  const count = pending.length

  return (
    <Menu
      align="right"
      chevron={false}
      ariaLabel={
        count ? `Notifications: ${count} ${count === 1 ? 'task' : 'tasks'} to do` : 'Notifications'
      }
      buttonClassName={`relative grid size-10 place-items-center rounded-control border border-space-700 transition-colors duration-150 hover:bg-space-800 ${
        tone === 'none' ? 'text-text-muted' : TONE_TEXT[tone]
      }`}
      label={
        <>
          <Bell size={20} strokeWidth={1.5} aria-hidden />
          {tone !== 'none' && (
            <span
              aria-hidden
              className={`reading absolute -top-1.5 -right-1.5 min-w-5 rounded-full px-1 text-center text-[11px] leading-5 font-semibold text-space-950 ${BADGE_BG[tone]}`}
            >
              {count}
            </span>
          )}
        </>
      }
    >
      {(close) => (
        <>
          {count === 0 ? (
            <p className="px-3 py-2 text-sm text-text">
              <span className="text-ok" aria-hidden>
                ✓{' '}
              </span>
              All done for today · next: {nextDailyLabel()}
            </p>
          ) : (
            pending.map((task) => {
              const display = taskDisplay(task, now)
              return (
                <Link
                  key={task.id}
                  to={task.link}
                  role="menuitem"
                  onClick={close}
                  className="flex items-center gap-2.5 rounded-control px-3 py-2 text-sm text-text hover:bg-space-800"
                >
                  <span
                    aria-hidden
                    className={`w-4 shrink-0 text-center ${TONE_TEXT[display.tone]}`}
                  >
                    {display.icon}
                  </span>
                  <span className="min-w-0 flex-1">{task.title}</span>
                  <span className={`text-xs font-semibold ${TONE_TEXT[display.tone]}`}>
                    {display.word}
                  </span>
                </Link>
              )
            })
          )}
          <MenuDivider />
          <Link
            to="/routine"
            role="menuitem"
            onClick={close}
            className="block rounded-control px-3 py-2 text-sm font-medium text-accent hover:bg-space-800"
          >
            See full routine →
          </Link>
        </>
      )}
    </Menu>
  )
}
