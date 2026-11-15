import { differenceInCalendarDays } from 'date-fns'
import { SYSTEMS } from '../data/systems'
import type {
  Baselines,
  CheckIn,
  CheckInTier,
  Indicator,
  IndicatorId,
  MissionEvent,
  MissionProfile,
  Profile,
  ReadingValue,
  Status,
  SystemId,
} from '../types'
import {
  type DoseSummary,
  type MissionProgress,
  type Projections,
  boneLossByDay,
  collectHistory,
  commsDelaySeconds,
  doseSummary,
  effectiveBaselines,
  missionProgress,
  projections,
  referencesFor,
} from './derived'
import { formatReading } from './format'
import {
  type IndicatorResult,
  type LatestValues,
  type RaisedStatus,
  type References,
  scoreSystem,
  statusReason,
} from './status'
import { type HistoryPoint, type TrendDirection, trendDirection, trendStatus } from './trends'

// Everything the screens need about one crew member, worked out in one place (plan/tasks.md 2.5).
// Pure: same dataset + mission + today → same result. The store memoizes it.

export type Dataset = { profile: Profile; checkIns: CheckIn[]; events: MissionEvent[] }

export type SystemHealth = {
  id: SystemId
  status: Status
  /** The sentence under the system name, e.g. "Body temperature: 38.2 °C" */
  reason: string
  driverId?: IndicatorId
  indicators: IndicatorResult[]
  /** Arrow for the system list (from the driving indicator, or the first with data) */
  trend: TrendDirection
  /** Short current value for the pin label and system list, e.g. "38.2 °C", "31% budget" */
  headline?: string
}

export type Health = {
  progress: MissionProgress
  commsDelaySeconds: number
  baselines: Baselines
  references: References
  /** Every reading by indicator, oldest → newest, including the calculated bone-loss series */
  history: Record<IndicatorId, HistoryPoint[]>
  /** Latest value per indicator that is still current (see FRESH_DAYS) */
  latest: LatestValues
  systems: Record<SystemId, SystemHealth>
  /** How many systems are green / amber / red / not recorded */
  readiness: Record<Status, number>
  /** The first red system, else the first amber one */
  mostUrgent?: { systemId: SystemId; status: Status; reason: string }
  dose: DoseSummary
  projections: Projections
  /** A completed daily check-in exists for today */
  checkInDoneToday: boolean
}

/**
 * How long a reading stays current, in days. Follow-ups are only recorded when something triggers
 * them, so without this a mild headache from a month ago would keep a system amber forever.
 */
export const FRESH_DAYS: Record<CheckInTier, number> = {
  core: 2,
  followUp: 2,
  weekly: 10,
  auto: 10,
}

const ALL_INDICATORS: Indicator[] = SYSTEMS.flatMap((system) => system.indicators)

/** The latest non-skipped value in a history, if it is recent enough for the indicator's tier */
function currentValue(
  indicator: Indicator,
  points: HistoryPoint[] | undefined,
  today: Date,
): ReadingValue | undefined {
  const latest = [...(points ?? [])]
    .reverse()
    .find((p) => p.value !== null && p.value !== undefined)
  if (!latest) return undefined
  const age = differenceInCalendarDays(today, new Date(latest.recordedAt))
  return age < FRESH_DAYS[indicator.tier] ? latest.value : undefined
}

export function computeHealth(dataset: Dataset, mission: MissionProfile, today: Date): Health {
  const { profile, checkIns } = dataset
  const progress = missionProgress(profile.mission, today)
  const history = collectHistory(checkIns)

  // Calculated indicators (tier "auto", input "calculated")
  const boneLoss = boneLossByDay(profile.mission, history.exerciseMinutes ?? [], today)
  if (boneLoss.length) history.boneLossEstimate = boneLoss
  const dose = doseSummary(mission, history.cumulativeDose ?? [])

  const baselines = effectiveBaselines(profile, history)
  const references = referencesFor(profile, baselines, mission, history)

  const latest: LatestValues = {}
  for (const indicator of ALL_INDICATORS) {
    const value = currentValue(indicator, history[indicator.id], today)
    if (value !== undefined) latest[indicator.id] = value
  }
  if (dose.ratePerDayMicroSv !== undefined && latest.cumulativeDose !== undefined) {
    latest.doseRate = dose.ratePerDayMicroSv
  }

  // Trend rules, only for indicators with a current reading
  const trends: Partial<Record<IndicatorId, RaisedStatus>> = {}
  for (const indicator of ALL_INDICATORS) {
    if (latest[indicator.id] === undefined) continue
    const result = trendStatus(indicator, history[indicator.id] ?? [], references[indicator.id])
    if (result) trends[indicator.id] = result
  }

  const systems = {} as Record<SystemId, SystemHealth>
  const readiness: Record<Status, number> = { green: 0, amber: 0, red: 0, none: 0 }
  for (const system of SYSTEMS) {
    const result = scoreSystem(system, latest, {
      references,
      allIndicators: ALL_INDICATORS,
      trends,
    })
    const arrowIndicator =
      system.indicators.find((i) => i.id === result.driverId) ??
      system.indicators.find((i) => latest[i.id] !== undefined)
    const headline =
      system.id === 'radiation' &&
      dose.percentOfBudget !== undefined &&
      latest.cumulativeDose !== undefined
        ? `${Math.round(dose.percentOfBudget)}% budget`
        : arrowIndicator
          ? formatReading(arrowIndicator, latest[arrowIndicator.id])
          : undefined
    systems[system.id] = {
      id: system.id,
      status: result.status,
      reason: statusReason(system, result, latest),
      driverId: result.driverId,
      indicators: result.indicators,
      trend: arrowIndicator
        ? trendDirection(arrowIndicator, history[arrowIndicator.id] ?? [])
        : 'flat',
      headline,
    }
    readiness[result.status]++
  }

  const urgent =
    SYSTEMS.find((s) => systems[s.id].status === 'red') ??
    SYSTEMS.find((s) => systems[s.id].status === 'amber')
  const mostUrgent = urgent
    ? {
        systemId: urgent.id,
        status: systems[urgent.id].status,
        reason: systems[urgent.id].reason,
      }
    : undefined

  return {
    progress,
    commsDelaySeconds: commsDelaySeconds(mission, progress.day, progress.lengthDays),
    baselines,
    references,
    history,
    latest,
    systems,
    readiness,
    mostUrgent,
    dose,
    projections: projections(profile.mission, mission, boneLoss, dose, today),
    checkInDoneToday: checkIns.some(
      (checkIn) =>
        checkIn.mode.kind === 'daily' &&
        checkIn.completedAt !== undefined &&
        differenceInCalendarDays(today, new Date(checkIn.startedAt)) === 0,
    ),
  }
}
