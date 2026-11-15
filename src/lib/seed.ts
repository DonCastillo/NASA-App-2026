import { addDays, formatISO, setHours, setMinutes, startOfDay } from 'date-fns'
import { DEMO_CREW, DEMO_CURRENT_DAY, type DemoCrewMember } from '../data/demoCrew'
import { MISSIONS } from '../data/missions'
import type {
  CheckIn,
  MissionEvent,
  MissionProfileId,
  Profile,
  Reading,
  ReadingValue,
} from '../types'
import { createRandom, type Random } from './random'

// Demo data generator (plan/tasks.md 2.1). Deterministic: the same crew member and mission always
// give the same values. Only the dates move, so the seeded "current day" is always today.
// Generated on load and never stored (CLAUDE.md → Architecture rules).
//
// 2.1 produces normal day-to-day variation around each person's baselines.
// 2.2 adds the article trends and demo storylines on top.

export type DemoDataset = {
  profile: Profile
  checkIns: CheckIn[]
  events: MissionEvent[]
}

/** Weekly items, spread across the week: mission day % 7 → indicator */
const WEEKLY_DAY: Record<string, number> = {
  nearVision: 1,
  strengthTest: 2,
  bodyMass: 3,
  bloodGlucose: 4,
  cumulativeDose: 5,
  crewRelations: 6,
}

const round = (value: number, decimals = 0) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** A crew member's profile on a given mission, with the start date set so `today` is the seeded day */
export function demoProfile(
  crew: DemoCrewMember,
  missionId: MissionProfileId,
  today: Date = new Date(),
): Profile {
  const startDate = addDays(startOfDay(today), -(DEMO_CURRENT_DAY[missionId] - 1))
  return {
    ...crew,
    mission: {
      profileId: missionId,
      startDate: formatISO(startDate, { representation: 'date' }),
      lengthDays: MISSIONS[missionId].defaultLengthDays,
    },
  }
}

/** One day's readings for one crew member: core daily items, plus the weekly item due that day */
function dayReadings(
  crew: DemoCrewMember,
  missionId: MissionProfileId,
  day: number,
  at: string,
  random: Random,
): Reading[] {
  const b = crew.baselines
  const values: Record<string, ReadingValue> = {
    // Core daily (tier 1)
    bloodPressure: [
      round(random.normal(b.restingSystolic ?? 120, 4)),
      round(random.normal(b.restingDiastolic ?? 78, 3)),
    ],
    restingHeartRate: round(random.normal(b.restingHeartRate ?? 62, 3)),
    bodyTemperature: round(random.normal(36.7, 0.2), 1),
    sleepHours: round(clamp(random.normal(b.typicalSleepHours ?? 7.2, 0.4), 4, 10), 1),
    mood: clamp(round(random.normal(4.3, 0.5)), 1, 5),
    exerciseMinutes: round(clamp(random.normal(95, 8), 0, 180)),
  }

  // Weekly items (tier 3) on their day of the week
  const weekday = day % 7
  if (weekday === WEEKLY_DAY.nearVision) values.nearVision = b.nearVisionLines ?? 10
  if (weekday === WEEKLY_DAY.strengthTest) {
    values.strengthTest = round(random.normal(b.strengthScore ?? 60, 1))
  }
  if (weekday === WEEKLY_DAY.bodyMass) {
    values.bodyMass = round(random.normal(crew.preflightBodyMassKg ?? 70, 0.3), 1)
  }
  if (weekday === WEEKLY_DAY.bloodGlucose) values.bloodGlucose = round(random.normal(88, 5))
  if (weekday === WEEKLY_DAY.cumulativeDose) {
    const expectedMilliSv = (MISSIONS[missionId].radiationPerDayMicroSv * day) / 1000
    values.cumulativeDose = round(expectedMilliSv * random.normal(1, 0.02), 1)
  }
  if (weekday === WEEKLY_DAY.crewRelations) {
    values.crewRelations = clamp(round(random.normal(4.4, 0.5)), 1, 5)
  }

  return Object.entries(values).map(([indicatorId, value]) => ({
    indicatorId,
    value,
    recordedAt: at,
  }))
}

/** Full demo history for one crew member on one mission: one completed daily check-in per day */
export function generateDemoData(
  crew: DemoCrewMember,
  missionId: MissionProfileId,
  today: Date = new Date(),
): DemoDataset {
  const profile = demoProfile(crew, missionId, today)
  const random = createRandom(`${crew.id}:${missionId}`)
  const start = startOfDay(addDays(today, -(DEMO_CURRENT_DAY[missionId] - 1)))

  const checkIns: CheckIn[] = []
  for (let day = 1; day <= DEMO_CURRENT_DAY[missionId]; day++) {
    // Morning check-in around 07:00–07:30
    const started = setMinutes(setHours(addDays(start, day - 1), 7), Math.floor(random.next() * 30))
    const startedAt = started.toISOString()
    checkIns.push({
      id: `${crew.id}-${missionId}-d${day}`,
      profileId: crew.id,
      mode: { kind: 'daily' },
      startedAt,
      completedAt: new Date(started.getTime() + 2 * 60 * 1000).toISOString(),
      readings: dayReadings(crew, missionId, day, startedAt, random),
      countermeasures: [],
    })
  }

  return { profile, checkIns, events: [] }
}

/** Demo data for all 3 crew members on one mission */
export function generateDemoCrew(
  missionId: MissionProfileId,
  today: Date = new Date(),
): DemoDataset[] {
  return DEMO_CREW.map((crew) => generateDemoData(crew, missionId, today))
}
