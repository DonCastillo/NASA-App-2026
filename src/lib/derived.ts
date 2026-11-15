import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import type {
  Baselines,
  CheckIn,
  IndicatorId,
  MissionProfile,
  MissionSettings,
  Profile,
} from '../types'
import type { References } from './status'
import { type HistoryPoint, dailyPoints } from './trends'

// Derived values: things the app works out instead of asking (plan/tasks.md 2.3).
// Pure functions: `today`, the profile and the readings are always passed in.

/** Parse "2026-04-01" as local midnight (not UTC), so day counts match the user's calendar */
export const parseLocalDate = (isoDate: string) => new Date(`${isoDate}T00:00`)

/** Every reading in the check-ins, grouped by indicator, oldest → newest */
export function collectHistory(checkIns: CheckIn[]): Record<IndicatorId, HistoryPoint[]> {
  const history: Record<IndicatorId, HistoryPoint[]> = {}
  for (const reading of checkIns.flatMap((checkIn) => checkIn.readings)) {
    ;(history[reading.indicatorId] ??= []).push({
      value: reading.value,
      recordedAt: reading.recordedAt,
    })
  }
  for (const points of Object.values(history)) {
    points.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
  }
  return history
}

// ─────────────────────────────────────────────────────────────────────────────
// Mission day and comms delay
// ─────────────────────────────────────────────────────────────────────────────

export type MissionProgress = {
  /** Mission day of `today`, starting at 1 on the start date (0 or less = not started) */
  day: number
  lengthDays: number
  /** 0–1, how far through the mission */
  progress: number
  daysLeft: number
}

/** "Day 47 of 210" from the mission start date and length */
export function missionProgress(settings: MissionSettings, today: Date): MissionProgress {
  const day = differenceInCalendarDays(today, parseLocalDate(settings.startDate)) + 1
  const progress = Math.min(1, Math.max(0, day / settings.lengthDays))
  return {
    day,
    lengthDays: settings.lengthDays,
    progress,
    daysLeft: Math.max(0, settings.lengthDays - day),
  }
}

/** One-way comms delay in seconds: fixed (ISS, Artemis) or growing with distance (Mars transit) */
export function commsDelaySeconds(
  mission: MissionProfile,
  day: number,
  lengthDays: number,
): number {
  const { commsDelay } = mission
  if (commsDelay.kind === 'fixed') return commsDelay.seconds
  const share = Math.min(1, Math.max(0, day / lengthDays))
  return commsDelay.maxSeconds * share
}

// ─────────────────────────────────────────────────────────────────────────────
// Bone loss estimate
// ─────────────────────────────────────────────────────────────────────────────

/** Bone loss per month with no exercise (articles: 1–1.5%/month without countermeasures) */
export const BONE_LOSS_NO_EXERCISE_PER_MONTH = 1.5
/** Bone loss per month at full exercise compliance (exercise slows, but doesn't stop, the loss) */
export const BONE_LOSS_FULL_EXERCISE_PER_MONTH = 0.6
/** Minutes per day that count as full compliance (ISS crews exercise ~1.5 h a day) */
export const FULL_EXERCISE_MINUTES = 90

/**
 * Estimated bone loss (%) at the end of each mission day, from exercise compliance.
 * Days without an exercise reading use the average compliance of the days that have one.
 */
export function boneLossByDay(
  settings: MissionSettings,
  exerciseHistory: HistoryPoint[],
  today: Date,
): HistoryPoint[] {
  const start = parseLocalDate(settings.startDate)
  const lastDay = Math.min(missionProgress(settings, today).day, settings.lengthDays)
  if (lastDay < 1) return []

  const complianceByDay = new Map<number, number>()
  for (const point of dailyPoints(exerciseHistory)) {
    if (typeof point.value !== 'number') continue
    const day = differenceInCalendarDays(new Date(point.recordedAt), start) + 1
    complianceByDay.set(day, Math.min(1, point.value / FULL_EXERCISE_MINUTES))
  }
  const known = [...complianceByDay.values()]
  const averageCompliance = known.length ? known.reduce((a, b) => a + b, 0) / known.length : 1

  const series: HistoryPoint[] = []
  let loss = 0
  for (let day = 1; day <= lastDay; day++) {
    const compliance = complianceByDay.get(day) ?? averageCompliance
    const perMonth =
      BONE_LOSS_NO_EXERCISE_PER_MONTH -
      (BONE_LOSS_NO_EXERCISE_PER_MONTH - BONE_LOSS_FULL_EXERCISE_PER_MONTH) * compliance
    loss += perMonth / 30
    series.push({
      value: Math.round(loss * 10) / 10,
      recordedAt: addDays(startOfDay(start), day - 1).toISOString(),
    })
  }
  return series
}

// ─────────────────────────────────────────────────────────────────────────────
// Radiation
// ─────────────────────────────────────────────────────────────────────────────

export type DoseSummary = {
  /** Latest dosimeter reading, mSv */
  latestMilliSv?: number
  /** When that reading was taken (it can be several days before today) */
  latestAt?: string
  /** Latest reading as % of the mission's dose budget */
  percentOfBudget?: number
  /** Measured daily rate between the last two readings, µSv/day (needs 2 readings on different days) */
  ratePerDayMicroSv?: number
}

export function doseSummary(mission: MissionProfile, doseHistory: HistoryPoint[]): DoseSummary {
  const points = dailyPoints(doseHistory).filter((p) => typeof p.value === 'number')
  const latest = points[points.length - 1]
  if (!latest) return {}
  const latestMilliSv = latest.value as number
  const summary: DoseSummary = {
    latestMilliSv,
    latestAt: latest.recordedAt,
    percentOfBudget: (latestMilliSv / mission.doseBudgetMilliSv) * 100,
  }
  const previous = points[points.length - 2]
  if (previous) {
    const days = differenceInCalendarDays(
      new Date(latest.recordedAt),
      new Date(previous.recordedAt),
    )
    if (days > 0) {
      summary.ratePerDayMicroSv = ((latestMilliSv - (previous.value as number)) * 1000) / days
    }
  }
  return summary
}

// ─────────────────────────────────────────────────────────────────────────────
// Baselines and references
// ─────────────────────────────────────────────────────────────────────────────

const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined

/** Numbers from the first 7 days of an indicator's history (`pick` chooses which number) */
function firstWeek(points: HistoryPoint[], pick: (value: unknown) => number | undefined) {
  const daily = dailyPoints(points)
  if (!daily.length) return []
  const first = new Date(daily[0].recordedAt)
  return daily
    .filter((p) => differenceInCalendarDays(new Date(p.recordedAt), first) < 7)
    .map((p) => pick(p.value))
    .filter((v): v is number => typeof v === 'number')
}

const asNumber = (value: unknown) => (typeof value === 'number' ? value : undefined)
const pairPart = (index: 0 | 1) => (value: unknown) =>
  Array.isArray(value) && typeof value[index] === 'number' ? (value[index] as number) : undefined

/**
 * The profile's baselines, with any missing one filled from the average of the first 7 days
 * of check-ins (plan/body-systems.md → Preflight baselines).
 */
export function effectiveBaselines(
  profile: Profile,
  history: Record<IndicatorId, HistoryPoint[]>,
): Baselines {
  const fallback = (id: IndicatorId, pick = asNumber) => average(firstWeek(history[id] ?? [], pick))
  const b = profile.baselines
  return {
    restingSystolic: b.restingSystolic ?? fallback('bloodPressure', pairPart(0)),
    restingDiastolic: b.restingDiastolic ?? fallback('bloodPressure', pairPart(1)),
    restingHeartRate: b.restingHeartRate ?? fallback('restingHeartRate'),
    strengthScore: b.strengthScore ?? fallback('strengthTest'),
    nearVisionLines: b.nearVisionLines ?? fallback('nearVision'),
    balanceSeconds: b.balanceSeconds ?? fallback('balanceTest'),
    typicalSleepHours: b.typicalSleepHours ?? fallback('sleepHours'),
  }
}

/** Reference numbers for indicators scored against a baseline, budget or normal rate (for scoreSystem) */
export function referencesFor(
  profile: Profile,
  baselines: Baselines,
  mission: MissionProfile,
  history: Record<IndicatorId, HistoryPoint[]>,
): References {
  return {
    nearVision: baselines.nearVisionLines,
    strengthTest: baselines.strengthScore,
    balanceTest: baselines.balanceSeconds,
    bodyMass: profile.preflightBodyMassKg ?? average(firstWeek(history.bodyMass ?? [], asNumber)),
    cumulativeDose: mission.doseBudgetMilliSv,
    doseRate: mission.radiationPerDayMicroSv,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// End-of-mission projections
// ─────────────────────────────────────────────────────────────────────────────

export type Projections = {
  /** Estimated bone loss at mission end, % (at the last 30 days' pace) */
  boneLossPercent?: number
  /** Estimated cumulative dose at mission end, mSv (at the measured rate, or the mission's normal rate) */
  doseMilliSv?: number
  /** That dose as % of the mission budget */
  dosePercentOfBudget?: number
}

export function projections(
  settings: MissionSettings,
  mission: MissionProfile,
  boneLoss: HistoryPoint[],
  dose: DoseSummary,
  today: Date,
): Projections {
  const { daysLeft } = missionProgress(settings, today)
  const result: Projections = {}

  if (boneLoss.length) {
    const recent = boneLoss.slice(-30)
    const first = recent[0].value as number
    const last = recent[recent.length - 1].value as number
    const perDay = recent.length > 1 ? (last - first) / (recent.length - 1) : 0
    result.boneLossPercent = Math.round((last + perDay * daysLeft) * 10) / 10
  }

  if (dose.latestMilliSv !== undefined && dose.latestAt) {
    const rate = dose.ratePerDayMicroSv ?? mission.radiationPerDayMicroSv
    // Project from the day of the latest reading (not today) to the last mission day
    const missionEnd = addDays(parseLocalDate(settings.startDate), settings.lengthDays - 1)
    const daysToEnd = Math.max(0, differenceInCalendarDays(missionEnd, new Date(dose.latestAt)))
    result.doseMilliSv = Math.round((dose.latestMilliSv + (rate * daysToEnd) / 1000) * 10) / 10
    result.dosePercentOfBudget = (result.doseMilliSv / mission.doseBudgetMilliSv) * 100
  }
  return result
}

/**
 * The setup baseline for indicators scored on absolute values (blood pressure, heart rate, sleep).
 * Relative indicators compare with their reference instead (see referencesFor).
 */
export function setupBaseline(
  id: IndicatorId,
  baselines: Baselines,
): number | [number, number] | undefined {
  switch (id) {
    case 'bloodPressure':
      return baselines.restingSystolic !== undefined && baselines.restingDiastolic !== undefined
        ? [baselines.restingSystolic, baselines.restingDiastolic]
        : undefined
    case 'restingHeartRate':
      return baselines.restingHeartRate
    case 'sleepHours':
      return baselines.typicalSleepHours
    default:
      return undefined
  }
}
