import { differenceInCalendarDays } from 'date-fns'
import type { Indicator, ReadingValue, ScoredStatus, Status } from '../types'
import { type RaisedStatus, bandFor, comparedValue, scoreIndicator } from './status'

// Trend rules: look at an indicator's history, not just the latest reading (plan/tasks.md 1.6).
// Pure functions. History is oldest → newest; one value per calendar day is used (the last that day).
//
// Three rules can raise a status (never lower it):
//   1. Streak    — the indicator's own StreakRule, e.g. exercise under 60 min for 3 days → red
//   2. Recovery  — the 3 days before today were amber or worse, so one good reading stays amber
//   3. Drift     — green values heading steadily toward a threshold turn amber early
// Plus the trend arrow for the system list (↑ ↗ → ↘ ↓).

export type HistoryPoint = { value: ReadingValue; recordedAt: string }

const RANK: Record<Status, number> = { none: 0, green: 1, amber: 2, red: 3 }
const atLeast = (status: Status, threshold: ScoredStatus) => RANK[status] >= RANK[threshold]

/** Keep the last recorded (non-skipped) value of each calendar day, oldest → newest */
export function dailyPoints(history: HistoryPoint[]): HistoryPoint[] {
  const byDay = new Map<string, HistoryPoint>()
  const sorted = [...history]
    .filter((point) => point.value !== null && point.value !== undefined)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
  for (const point of sorted) {
    const d = new Date(point.recordedAt)
    byDay.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, point)
  }
  return [...byDay.values()]
}

/** The newest run of points on consecutive calendar days, oldest → newest */
function latestConsecutiveRun(points: HistoryPoint[]): HistoryPoint[] {
  const run: HistoryPoint[] = []
  for (let i = points.length - 1; i >= 0; i--) {
    const next = run[0]
    if (
      next &&
      differenceInCalendarDays(new Date(next.recordedAt), new Date(points[i].recordedAt)) !== 1
    )
      break
    run.unshift(points[i])
  }
  return run
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Streak rules
// ─────────────────────────────────────────────────────────────────────────────

/** Applies the indicator's StreakRule, e.g. appetite 1–2 for 3+ days → red */
export function streakStatus(
  indicator: Indicator,
  history: HistoryPoint[],
  reference?: number,
): RaisedStatus | undefined {
  const rule = indicator.streak
  if (!rule) return undefined
  const run = latestConsecutiveRun(dailyPoints(history))
  let count = 0
  for (let i = run.length - 1; i >= 0; i--) {
    const { value } = run[i]
    const matches =
      atLeast(scoreIndicator(indicator, value, reference), rule.when) &&
      (rule.below === undefined || (typeof value === 'number' && value < rule.below))
    if (!matches) break
    count++
  }
  return count >= rule.days
    ? { status: rule.becomes, reason: `${indicator.name}: out of range ${count} days in a row` }
    : undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Not yet recovered
// ─────────────────────────────────────────────────────────────────────────────

/** Today is green, but the 3 days before were amber or worse → stays amber until confirmed */
export function recoveryStatus(
  indicator: Indicator,
  history: HistoryPoint[],
  reference?: number,
): RaisedStatus | undefined {
  const run = latestConsecutiveRun(dailyPoints(history))
  if (run.length < 4) return undefined
  const [latest, ...before] = [...run].reverse()
  if (scoreIndicator(indicator, latest.value, reference) !== 'green') return undefined
  const previousThree = before.slice(0, 3)
  return previousThree.every((point) =>
    atLeast(scoreIndicator(indicator, point.value, reference), 'amber'),
  )
    ? {
        status: 'amber',
        reason: `${indicator.name}: back in range today after 3 days out of range`,
      }
    : undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Drift toward a threshold
// ─────────────────────────────────────────────────────────────────────────────

/** Days between readings and their compared values (only plain numbers can drift) */
function numericSeries(indicator: Indicator, history: HistoryPoint[], reference?: number) {
  if (indicator.scoring.kind !== 'bands') return []
  if (indicator.input !== 'number' && indicator.input !== 'calculated') return []
  const points = dailyPoints(history).slice(-7)
  if (!points.length) return []
  const first = new Date(points[0].recordedAt)
  return points.flatMap((point) => {
    if (typeof point.value !== 'number') return []
    const y = comparedValue(indicator, point.value, reference)
    if (y === undefined) return []
    return [{ x: differenceInCalendarDays(new Date(point.recordedAt), first), y }]
  })
}

/** Least-squares line through the points: value ≈ intercept + slope × day */
function fitLine(points: { x: number; y: number }[]) {
  const n = points.length
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n
  const sxx = points.reduce((sum, p) => sum + (p.x - meanX) ** 2, 0)
  const sxy = points.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0)
  const slope = sxx === 0 ? 0 : sxy / sxx
  return { slope, intercept: meanY - slope * meanX }
}

/** How many days ahead the drift rule looks */
export const DRIFT_LOOKAHEAD_DAYS = 7

/**
 * Latest reading is green, but the last 4–7 days point steadily toward an amber or red band
 * within DRIFT_LOOKAHEAD_DAYS → amber early, e.g. bone loss creeping toward 3%.
 */
export function driftStatus(
  indicator: Indicator,
  history: HistoryPoint[],
  reference?: number,
): RaisedStatus | undefined {
  if (indicator.scoring.kind !== 'bands') return undefined
  const series = numericSeries(indicator, history, reference)
  if (series.length < 4) return undefined
  const latest = series[series.length - 1]
  if (bandFor(indicator.scoring.bands, latest.y)?.status !== 'green') return undefined
  const { slope, intercept } = fitLine(series)
  if (slope === 0) return undefined
  const projected = intercept + slope * (latest.x + DRIFT_LOOKAHEAD_DAYS)
  const ahead = bandFor(indicator.scoring.bands, projected)?.status
  return ahead === 'amber' || ahead === 'red'
    ? { status: 'amber', reason: `${indicator.name}: trending out of range` }
    : undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// All three together
// ─────────────────────────────────────────────────────────────────────────────

/** The highest status any trend rule gives, with its reason; undefined if none apply */
export function trendStatus(
  indicator: Indicator,
  history: HistoryPoint[],
  reference?: number,
): RaisedStatus | undefined {
  const results = [
    streakStatus(indicator, history, reference),
    recoveryStatus(indicator, history, reference),
    driftStatus(indicator, history, reference),
  ].filter((result): result is RaisedStatus => result !== undefined)
  return results.reduce<RaisedStatus | undefined>(
    (best, result) => (!best || RANK[result.status] > RANK[best.status] ? result : best),
    undefined,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Trend arrow for the system list
// ─────────────────────────────────────────────────────────────────────────────

export type TrendDirection = 'up' | 'slightUp' | 'flat' | 'slightDown' | 'down'

export const TREND_ARROWS: Record<TrendDirection, string> = {
  up: '↑',
  slightUp: '↗',
  flat: '→',
  slightDown: '↘',
  down: '↓',
}

/**
 * Direction of the value (not good or bad), comparing the average of the last 3 days with the 3
 * days before. Scales use point differences (0.5 / 1.5); other numbers use percent change (2% / 10%).
 */
export function trendDirection(indicator: Indicator, history: HistoryPoint[]): TrendDirection {
  const values = dailyPoints(history)
    .map((point) => point.value)
    .filter((value): value is number => typeof value === 'number')
    .slice(-6)
  if (values.length < 4) return 'flat'
  const recent = values.slice(-3)
  const earlier = values.slice(0, values.length - 3)
  const mean = (list: number[]) => list.reduce((sum, v) => sum + v, 0) / list.length
  const before = mean(earlier)
  const change = mean(recent) - before

  const isScale = indicator.input === 'severity' || indicator.input === 'rating'
  const usePoints = isScale || Math.abs(before) < 1
  const size = usePoints ? Math.abs(change) : (Math.abs(change) / Math.abs(before)) * 100
  const [small, large] = usePoints ? [0.5, 1.5] : [2, 10]

  if (size < small) return 'flat'
  if (change > 0) return size >= large ? 'up' : 'slightUp'
  return size >= large ? 'down' : 'slightDown'
}
