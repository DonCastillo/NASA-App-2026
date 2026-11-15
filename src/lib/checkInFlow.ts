import { SYSTEMS } from '../data/systems'
import type { CheckIn, CheckInMode, Indicator, IndicatorId, ReadingValue } from '../types'
import { formatNumber, formatReading, formatWhen } from './format'

// Helpers for the check-in page (plan/tasks.md 5.3). Pure.

/** Title of a check-in, e.g. "Daily check-in", "Check: Eyes & brain (SANS)" */
export function checkInTitle(mode: CheckInMode): string {
  if (mode.kind === 'daily') return 'Daily check-in'
  if (mode.kind === 'system') {
    return `Check: ${SYSTEMS.find((s) => s.id === mode.systemId)?.name ?? 'system'}`
  }
  return 'Check-in'
}

/** Two modes are the same check-in (used to resume the right draft) */
export const sameMode = (a: CheckInMode, b: CheckInMode) => JSON.stringify(a) === JSON.stringify(b)

/** The check-in mode from the URL: /check-in, ?system=eyes, ?task=recheck-bodyTemperature */
export function modeFromSearch(params: URLSearchParams): CheckInMode {
  const systemId = params.get('system')
  const task = params.get('task')
  if (systemId && SYSTEMS.some((s) => s.id === systemId)) {
    return { kind: 'system', systemId: systemId as (typeof SYSTEMS)[number]['id'] }
  }
  if (task) return { kind: 'task', taskId: task }
  return { kind: 'daily' }
}

/** The last recorded (non-skipped) value of an indicator in past check-ins */
export function lastValue(
  indicatorId: IndicatorId,
  checkIns: CheckIn[],
): { value: Exclude<ReadingValue, null>; recordedAt: string } | undefined {
  let best: { value: Exclude<ReadingValue, null>; recordedAt: string } | undefined
  for (const checkIn of checkIns) {
    for (const reading of checkIn.readings) {
      if (reading.indicatorId !== indicatorId || reading.value === null) continue
      if (!best || reading.recordedAt > best.recordedAt) {
        best = { value: reading.value, recordedAt: reading.recordedAt }
      }
    }
  }
  return best
}

/** "yesterday: 36.6 °C" or "last: 36.6 °C · 3 days ago" */
export function lastValueHint(
  indicator: Indicator,
  last: { value: ReadingValue; recordedAt: string },
  now: Date,
): string {
  const when = formatWhen(last.recordedAt, now)
  const value = formatReading(indicator, last.value)
  if (when === 'yesterday') return `yesterday: ${value}`
  if (when.startsWith('today')) return `earlier today: ${value}`
  return `last: ${value} · ${when}`
}

/**
 * A short warning when a number is outside the indicator's plausible range, e.g.
 * "45 °C looks unusual. Please check the reading." Undefined when it looks fine.
 */
export function plausibilityWarning(
  indicator: Indicator,
  value: ReadingValue | undefined,
): string | undefined {
  const range = indicator.plausible
  if (!range) return undefined
  const numbers =
    Array.isArray(value) && typeof value[0] === 'number'
      ? (value as number[])
      : typeof value === 'number'
        ? [value]
        : []
  const odd = numbers.find((n) => n < range.min || n > range.max)
  if (odd === undefined) return undefined
  const unit = indicator.unit ? (indicator.unit === '%' ? '%' : ` ${indicator.unit}`) : ''
  return `${formatNumber(odd)}${unit} looks unusual. Please check the reading.`
}
