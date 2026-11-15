import { Link } from 'react-router'
import { STATUS_DISPLAY } from '../data/statusDisplay'
import { SYSTEMS } from '../data/systems'
import type { Health } from '../lib/health'
import { TREND_ARROWS, type TrendDirection } from '../lib/trends'
import type { SystemId } from '../types'

// The system list on the home page (plan/site-map.md → Body Map, plan/tasks.md 3.4):
// one row per system with status, latest value and trend arrow. Each row is a link to the system.
// It is the keyboard and screen-reader path to everything on the body figure, and it is linked to
// the figure: hovering a row highlights its pin, and hovering a pin highlights its row.

const TREND_WORDS: Record<TrendDirection, string> = {
  up: 'rising',
  slightUp: 'rising slightly',
  flat: 'steady',
  slightDown: 'falling slightly',
  down: 'falling',
}

type Props = {
  health: Health
  highlighted?: SystemId
  onHighlight?: (systemId: SystemId | undefined) => void
}

export default function SystemList({ health, highlighted, onHighlight }: Props) {
  return (
    <nav aria-label="Body systems">
      <ul className="flex flex-col gap-1">
        {SYSTEMS.map((system) => {
          const systemHealth = health.systems[system.id]
          const display = STATUS_DISPLAY[systemHealth.status]
          const recorded = systemHealth.status !== 'none'
          const trendWord = TREND_WORDS[systemHealth.trend]
          return (
            <li key={system.id}>
              <Link
                to={`/system/${system.id}`}
                aria-label={[
                  `${system.name}: ${display.word}`,
                  systemHealth.headline,
                  recorded ? trendWord : undefined,
                ]
                  .filter(Boolean)
                  .join(', ')}
                data-system={system.id}
                onMouseEnter={() => onHighlight?.(system.id)}
                onMouseLeave={() => onHighlight?.(undefined)}
                onFocus={() => onHighlight?.(system.id)}
                onBlur={() => onHighlight?.(undefined)}
                className={`flex min-h-12 items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors duration-150 ${
                  highlighted === system.id ? 'bg-space-800' : 'hover:bg-space-800'
                }`}
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: display.color }}
                />
                <span className="min-w-0 flex-1 truncate text-text">{system.name}</span>
                <span className="reading shrink-0 text-[13px] text-text-muted">
                  {recorded ? systemHealth.headline : 'Not recorded'}
                </span>
                <span
                  aria-hidden
                  className="w-16 shrink-0 text-right text-xs font-semibold"
                  style={{ color: display.textColor }}
                >
                  {recorded ? `${display.icon} ${display.word}` : display.icon}
                </span>
                <span
                  aria-hidden
                  title={recorded ? trendWord : undefined}
                  className="w-4 shrink-0 text-center text-text-muted"
                >
                  {recorded ? TREND_ARROWS[systemHealth.trend] : ''}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
