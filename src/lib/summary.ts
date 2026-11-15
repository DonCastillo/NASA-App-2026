import { DEFAULT_RECHECK, RECHECKS, type RecheckRule } from '../data/rechecks'
import { SYSTEMS } from '../data/systems'
import type { IndicatorId, Status, SystemDef } from '../types'
import type { Health } from './health'

// The check-in summary (plan/site-map.md → Check-in → Summary screen, plan/tasks.md 5.4):
// what changed between the health picture before and after saving the check-in. Pure.

export type StatusChange = {
  system: SystemDef
  from: Status
  to: Status
  reason: string
  /** The system's first action for its new status (none when it became green or unrecorded) */
  firstAction?: string
}

/** Systems whose status changed, worst new status first */
export function statusChanges(before: Health, after: Health): StatusChange[] {
  const rank: Record<Status, number> = { red: 0, amber: 1, green: 2, none: 3 }
  return SYSTEMS.flatMap((system) => {
    const from = before.systems[system.id].status
    const to = after.systems[system.id].status
    if (from === to) return []
    return [
      {
        system,
        from,
        to,
        reason: after.systems[system.id].reason,
        firstAction: to === 'amber' || to === 'red' ? system.actions[to][0] : undefined,
      },
    ]
  }).sort((a, b) => rank[a.to] - rank[b.to])
}

export type Recheck = { indicatorId: IndicatorId; text: string; rule: RecheckRule }

/**
 * Recheck suggestions for systems that became amber or red: one per system, for the indicator
 * that drives its status, e.g. "Recheck body temperature in 4–6 h".
 */
export function rechecksFor(changes: StatusChange[], after: Health): Recheck[] {
  return changes.flatMap((change) => {
    if (change.to !== 'amber' && change.to !== 'red') return []
    const driverId = after.systems[change.system.id].driverId
    const indicator = change.system.indicators.find((i) => i.id === driverId)
    if (!indicator || indicator.input === 'calculated') return []
    const rule = RECHECKS[indicator.id] ?? DEFAULT_RECHECK
    return [
      {
        indicatorId: indicator.id,
        rule,
        text: `Recheck ${indicator.name.charAt(0).toLowerCase()}${indicator.name.slice(1)} ${rule.label}`,
      },
    ]
  })
}

/** "1 min 48 s", "45 s", "12 min" */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  if (minutes === 0) return `${seconds} s`
  if (minutes >= 10 || seconds === 0) return `${minutes} min`
  return `${minutes} min ${seconds} s`
}
