import type {
  Band,
  Indicator,
  IndicatorId,
  ReadingValue,
  ScoredStatus,
  Status,
  SystemDef,
} from '../types'
import { describeReading } from './format'

// Scoring rules: readings in → green / amber / red out (plan/tasks.md 1.5).
// Pure functions: no React, no storage. Thresholds come from src/data/systems/*.ts.
//
// Some indicators are compared with a reference number (see ScoringBasis in src/types.ts):
// the preflight baseline, the mission dose budget, or the mission's normal daily dose rate.
// Callers pass that number in; looking it up from the profile and mission is src/lib/derived.ts.

/** Latest value per indicator, across all systems (cross rules can look at other systems) */
export type LatestValues = Partial<Record<IndicatorId, ReadingValue>>

/** Reference number per indicator, for indicators scored against a baseline, budget or rate */
export type References = Partial<Record<IndicatorId, number>>

export type IndicatorResult = {
  indicatorId: IndicatorId
  status: Status
  /** Set when a cross rule or trend rule raised the status, e.g. "Headache with a vision change" */
  raisedBy?: string
}

/** A status raised by a rule that looks beyond the latest reading (src/lib/trends.ts) */
export type RaisedStatus = { status: Status; reason?: string }

export type ScoreSystemOptions = {
  /** Reference numbers for baseline/budget/rate-relative indicators */
  references?: References
  /** Every indicator in the app, so cross rules can score other systems' readings */
  allIndicators?: Indicator[]
  /** Statuses from trend rules (streaks, recovery, drift); they can only raise a status */
  trends?: Partial<Record<IndicatorId, RaisedStatus>>
}

export type SystemResult = {
  status: Status
  indicators: IndicatorResult[]
  /** The indicator that decides the system's status (the first one with the worst status) */
  driverId?: IndicatorId
}

// ─────────────────────────────────────────────────────────────────────────────
// Statuses
// ─────────────────────────────────────────────────────────────────────────────

const RANK: Record<Status, number> = { none: 0, green: 1, amber: 2, red: 3 }

/** The worst of several statuses: red > amber > green > none. Empty → none */
export function worstStatus(statuses: Status[]): Status {
  return statuses.reduce<Status>((worst, s) => (RANK[s] > RANK[worst] ? s : worst), 'none')
}

/** First band that contains the value (min ≤ value < max), or undefined */
export function bandFor(bands: Band[], value: number): Band | undefined {
  return bands.find(
    (band) =>
      (band.min === undefined || value >= band.min) && (band.max === undefined || value < band.max),
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// One indicator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The number that gets compared with the bands, after applying the indicator's basis.
 * Returns undefined when the basis needs a reference that is missing (or zero).
 *   strength 34 kg vs baseline 40 kg, 'percentOfBaseline' → 85
 *   body mass 69.3 vs 70, 'percentChangeFromBaseline'    → −1
 */
export function comparedValue(
  indicator: Indicator,
  value: number,
  reference?: number,
): number | undefined {
  const basis =
    indicator.scoring.kind === 'bands' ? (indicator.scoring.basis ?? 'absolute') : 'absolute'
  if (basis === 'absolute') return value
  if (reference === undefined) return undefined
  if (basis === 'changeFromBaseline') return value - reference
  if (reference === 0) return undefined
  switch (basis) {
    case 'percentOfBaseline':
    case 'percentOfBudget':
      return (value / reference) * 100
    case 'percentChangeFromBaseline':
      return ((value - reference) / reference) * 100
    case 'multipleOfBaseline':
      return value / reference
  }
}

/**
 * Score one reading. Skipped (null), missing, wrongly shaped values, or a missing reference → 'none'.
 * Streak rules ("3 days in a row") are applied separately in src/lib/trends.ts.
 */
export function scoreIndicator(
  indicator: Indicator,
  value: ReadingValue | undefined,
  reference?: number,
): Status {
  if (value === null || value === undefined) return 'none'
  const { scoring } = indicator

  switch (scoring.kind) {
    case 'bands': {
      if (typeof value !== 'number') return 'none'
      const compared = comparedValue(indicator, value, reference)
      if (compared === undefined) return 'none'
      return bandFor(scoring.bands, compared)?.status ?? 'none'
    }
    case 'pairBands': {
      if (!Array.isArray(value) || typeof value[0] !== 'number' || typeof value[1] !== 'number') {
        return 'none'
      }
      const first = bandFor(scoring.first, value[0])?.status ?? 'none'
      const second = bandFor(scoring.second, value[1] as number)?.status ?? 'none'
      return worstStatus([first, second])
    }
    case 'yesNo':
      if (typeof value !== 'boolean') return 'none'
      return value ? scoring.yes : scoring.no
    case 'checklist': {
      if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) return 'none'
      const ticked = value as string[]
      if (ticked.some((id) => scoring.redIfAny?.includes(id))) return 'red'
      return bandFor(scoring.countBands, ticked.length)?.status ?? 'none'
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross rules: one indicator's status depends on another indicator
// ─────────────────────────────────────────────────────────────────────────────

type CrossRule = {
  /** The indicator whose status is raised */
  target: IndicatorId
  raiseTo: ScoredStatus
  reason: string
  applies: (latest: LatestValues, statusOf: (id: IndicatorId) => Status) => boolean
}

const atLeast = (value: ReadingValue | undefined, n: number) =>
  typeof value === 'number' && value >= n

/** From plan/body-systems.md: "headache with vision change", "palpitations with dizziness", "fever with symptoms" */
export const CROSS_RULES: CrossRule[] = [
  {
    target: 'headache',
    raiseTo: 'red',
    reason: 'Headache with a vision change',
    applies: (latest, statusOf) =>
      atLeast(latest.headache, 1) &&
      (atLeast(latest.blurredVision, 1) || ['amber', 'red'].includes(statusOf('nearVision'))),
  },
  {
    target: 'palpitations',
    raiseTo: 'red',
    reason: 'Irregular heartbeat with dizziness',
    applies: (latest) => latest.palpitations === true && atLeast(latest.dizziness, 1),
  },
  {
    target: 'immuneSymptoms',
    raiseTo: 'red',
    reason: 'Fever with symptoms',
    applies: (latest) =>
      Array.isArray(latest.immuneSymptoms) &&
      latest.immuneSymptoms.length > 0 &&
      atLeast(latest.bodyTemperature, 38),
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// One system
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score every indicator in a system, then apply cross rules and trend results (they only ever
 * raise a status), then take the worst. A system with nothing recorded is 'none'.
 */
export function scoreSystem(
  system: SystemDef,
  latest: LatestValues,
  { references = {}, allIndicators = system.indicators, trends = {} }: ScoreSystemOptions = {},
): SystemResult {
  const byId = new Map(allIndicators.map((indicator) => [indicator.id, indicator]))
  const statusOf = (id: IndicatorId): Status => {
    const indicator = byId.get(id)
    return indicator ? scoreIndicator(indicator, latest[id], references[id]) : 'none'
  }

  const indicators: IndicatorResult[] = system.indicators.map((indicator) => {
    let status = statusOf(indicator.id)
    let raisedBy: string | undefined
    const raise = (to: Status, reason?: string) => {
      if (RANK[to] > RANK[status]) {
        status = to
        raisedBy = reason
      }
    }
    for (const rule of CROSS_RULES) {
      if (rule.target === indicator.id && rule.applies(latest, statusOf)) {
        raise(rule.raiseTo, rule.reason)
      }
    }
    const trend = trends[indicator.id]
    if (trend) raise(trend.status, trend.reason)
    return { indicatorId: indicator.id, status, raisedBy }
  })

  const status = worstStatus(indicators.map((result) => result.status))
  const driver =
    status === 'none' ? undefined : indicators.find((result) => result.status === status)
  return { status, indicators, driverId: driver?.indicatorId }
}

/**
 * The one plain sentence under the system name in System detail, e.g.
 * "Body temperature: 38.2 °C", "Near-vision self-check: 2 lines worse than baseline" or
 * "Headache with a vision change".
 */
export function statusReason(
  system: SystemDef,
  result: SystemResult,
  latest: LatestValues,
  references: References = {},
): string {
  if (result.status === 'none') return 'Nothing recorded yet.'
  if (result.status === 'green') return 'All recorded indicators are in range.'
  const driver = result.indicators.find((r) => r.indicatorId === result.driverId)
  const indicator = system.indicators.find((i) => i.id === result.driverId)
  if (!driver || !indicator) return ''
  if (driver.raisedBy) return driver.raisedBy
  return `${indicator.name}: ${describeReading(indicator, latest[indicator.id], references[indicator.id])}`
}
