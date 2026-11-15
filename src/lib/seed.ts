import { addDays, formatISO, setHours, setMinutes, startOfDay } from 'date-fns'
import {
  DEMO_CREW,
  DEMO_CURRENT_DAY,
  DEMO_EVENTS,
  type DemoCrewMember,
  type DemoEvent,
} from '../data/demoCrew'
import { MISSIONS } from '../data/missions'
import { BONE_MEDICATION_SLOT, WEEKLY_SLOTS } from '../data/schedule'
import type {
  CheckIn,
  CountermeasureAnswer,
  MissionEvent,
  MissionProfileId,
  Profile,
  Reading,
  ReadingValue,
} from '../types'
import { createRandom, type Random } from './random'

// Demo data generator (plan/tasks.md 2.1–2.2). Deterministic: the same crew member and mission always
// give the same values. Only the dates move, so the seeded "current day" is always today.
// Generated on load and never stored (CLAUDE.md → Architecture rules).
//
// Every day: normal variation around each person's baselines (2.1), plus the article trends and the
// crew member's storyline (2.2): SANS onset, an immune episode, or disrupted sleep.

export type DemoDataset = {
  profile: Profile
  checkIns: CheckIn[]
  events: MissionEvent[]
}

/** Extra dosimeter dose from one spacewalk, in mSv (spacewalk doses are much higher than inside) */
const SPACEWALK_EXTRA_MILLISV = 1.5

const round = (value: number, decimals = 0) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Mission start date, counted back so that `today` is the seeded current day */
function missionStart(missionId: MissionProfileId, today: Date): Date {
  return startOfDay(addDays(today, -(DEMO_CURRENT_DAY[missionId] - 1)))
}

/** A crew member's profile on a given mission, with the start date set so `today` is the seeded day */
export function demoProfile(
  crew: DemoCrewMember,
  missionId: MissionProfileId,
  today: Date = new Date(),
): Profile {
  // Drop the demo-only fields (story, strengthLossByEnd); they are not part of a Profile
  const { story: _story, strengthLossByEnd: _loss, ...profile } = crew
  return {
    ...profile,
    mission: {
      profileId: missionId,
      startDate: formatISO(missionStart(missionId, today), { representation: 'date' }),
      lengthDays: MISSIONS[missionId].defaultLengthDays,
    },
  }
}

const involves = (event: DemoEvent, crew: DemoCrewMember) =>
  event.crew === 'all' || event.crew.includes(crew.id)

/** Everything one day produces: readings and countermeasure answers */
type Day = {
  values: Record<string, ReadingValue>
  answers: Record<string, string>
}

/**
 * One day for one crew member.
 * `progress` = how far through the demo history (0–1), used to time the storylines;
 * `missionFraction` = how far through the whole mission (0–1), used for long-term decline.
 */
function simulateDay(
  crew: DemoCrewMember,
  missionId: MissionProfileId,
  day: number,
  random: Random,
): Day {
  const b = crew.baselines
  const currentDay = DEMO_CURRENT_DAY[missionId]
  const lengthDays = MISSIONS[missionId].defaultLengthDays
  const progress = day / currentDay
  const missionFraction = day / lengthDays
  const isToday = day === currentDay
  const daysAgo = currentDay - day
  const weekday = day % 7
  const myEvents = DEMO_EVENTS[missionId].filter((event) => involves(event, crew))
  const eventYesterday = myEvents.find((event) => event.day === day - 1)
  const eventTomorrow = myEvents.find((event) => event.day === day + 1)

  const values: Record<string, ReadingValue> = {}
  const answers: Record<string, string> = {}

  // ── Core daily readings (tier 1), normal variation around the baselines ──
  values.bloodPressure = [
    round(random.normal(b.restingSystolic ?? 120, 4)),
    round(random.normal(b.restingDiastolic ?? 78, 3)),
  ]
  values.restingHeartRate = round(random.normal(b.restingHeartRate ?? 62, 3))
  values.bodyTemperature = round(random.normal(36.7, 0.2), 1)
  values.sleepHours = round(clamp(random.normal(b.typicalSleepHours ?? 7.2, 0.4), 4, 10), 1)
  values.mood = clamp(round(random.normal(4.3, 0.5)), 1, 5)
  values.exerciseMinutes = round(clamp(random.normal(95, 8), 0, 180))

  // ── Sleep disruption and mood dips (everyone has a few bad nights; strongest for "sleep") ──
  const poorStretch = crew.story === 'sleep' ? (day + 5) % 23 < 3 : (day + crew.id.length) % 37 < 2
  if (poorStretch) {
    values.sleepHours = round(clamp(random.normal(6.1, 0.3), 4, 10), 1)
    values.mood = 3
  }

  // ── Storylines ──
  if (crew.story === 'sleep' && daysAgo <= 2) {
    // The last 3 nights: short sleep, low mood → mood amber 3 days in a row (red), sleep red today
    values.sleepHours = isToday ? 5.4 : round(random.normal(6.2, 0.15), 1)
    values.mood = 3
    // Tired: today's workout is cut short (60–89 min → amber)
    if (isToday) values.exerciseMinutes = 70
  }

  const sansOnset = crew.story === 'sans' && progress >= 0.55
  if (sansOnset && (random.chance(0.2) || isToday)) {
    // Mild headaches and blurred vision appear after onset; both today → red via the cross rule
    values.headache = 1
    values.blurredVision = 1
    answers.thighCuffs = isToday ? 'Yes, under 3 h' : random.chance(0.5) ? 'Yes, 3 h or more' : 'No'
  }

  if (crew.story === 'immune' && daysAgo <= 2) {
    // A dormant virus reactivates: cold sore, then a rising temperature
    values.bodyTemperature = [37.4, 37.9, 38.2][2 - daysAgo]
    values.immuneSymptoms = isToday ? ['coldSore', 'soreThroat'] : ['coldSore']
    if (isToday) answers.painOrFeverMedicine = 'No'
  }

  // ── Follow-ups that the check-in would have asked (tier 2 triggers) ──
  const sleep = values.sleepHours as number
  const mood = values.mood as number
  if (sleep < 7) {
    values.sleepQuality = sleep < 6 ? 2 : 3
    answers.brightLight = random.chance(0.5) ? 'Partly' : 'No'
    if (random.chance(0.5)) answers.caffeine = '1 drink'
  }
  if (mood <= 3) values.stress = clamp(round(random.normal(3.4, 0.5)), 1, 5)

  // ── Weekly items (tier 3) on their day of the week ──
  if (weekday === WEEKLY_SLOTS.nearVision || (sansOnset && isToday)) {
    // SANS: one line worse from onset, two lines worse near the end of the demo history
    const linesWorse = !sansOnset ? 0 : progress >= 0.85 ? 2 : 1
    values.nearVision = (b.nearVisionLines ?? 10) - linesWorse
  }
  if (weekday === WEEKLY_SLOTS.strengthTest) {
    // Strength falls through the mission (articles: 10–12% on average by the end)
    const expected = (b.strengthScore ?? 60) * (1 - crew.strengthLossByEnd * missionFraction)
    values.strengthTest = round(random.normal(expected, 0.8))
  }
  if (weekday === WEEKLY_SLOTS.bodyMass) {
    values.bodyMass = round(
      random.normal((crew.preflightBodyMassKg ?? 70) * (1 - 0.01 * missionFraction), 0.3),
      1,
    )
  }
  if (weekday === WEEKLY_SLOTS.bloodGlucose) values.bloodGlucose = round(random.normal(88, 5))
  if (weekday === WEEKLY_SLOTS.crewRelations) {
    values.crewRelations = clamp(round(random.normal(4.4, 0.5)), 1, 5)
  }

  // ── Radiation: the mission's daily rate (ISS ≈ 500 µSv/day from the 150 µSv/day neutron figure),
  //    plus extra dose from each spacewalk. Read weekly and the day after a spacewalk. ──
  if (weekday === WEEKLY_SLOTS.cumulativeDose || eventYesterday?.type === 'spacewalk') {
    const spacewalks = myEvents.filter((e) => e.type === 'spacewalk' && e.day < day).length
    const expectedMilliSv =
      (MISSIONS[missionId].radiationPerDayMicroSv * day) / 1000 +
      spacewalks * SPACEWALK_EXTRA_MILLISV
    values.cumulativeDose = round(expectedMilliSv * random.normal(1, 0.02), 1)
  }

  // ── After a landing or gravity transition: motion sickness, dizziness, balance on the surface ──
  const transition = myEvents.find(
    (event) =>
      (event.type === 'landing' || event.type === 'gravityTransition') &&
      event.day < day &&
      day - event.day <= 3,
  )
  if (transition) {
    const sinceEvent = day - transition.day // 1, 2 or 3 days after
    values.motionSickness = [2, 1, 0][sinceEvent - 1]
    values.dizziness = [1, 1, 0][sinceEvent - 1]
    if (sinceEvent === 1) answers.motionSicknessMedicine = 'Yes, after symptoms'
    if (missionId === 'artemis' && transition.type === 'landing') {
      // Balance on the Moon: worse right after landing, recovering over the next days
      const worse = [0.3, 0.15, 0.05][sinceEvent - 1]
      values.balanceTest = round((b.balanceSeconds ?? 30) * (1 - worse))
    }
  }

  // ── Before a landing: the pre-landing countermeasures ──
  if (eventTomorrow?.type === 'landing') {
    answers.fluidLoading = 'Yes'
    answers.compressionGarments = 'Yes'
  }

  // ── Routine countermeasures for listed supplements / medications ──
  if (crew.supplements.includes('bVitamin')) {
    answers.dailySupplements = random.chance(0.08) ? 'Missed today' : 'Yes'
  }
  if (crew.supplements.includes('boneMedication') && weekday === BONE_MEDICATION_SLOT) {
    answers.boneMedication = 'Yes'
  }

  return { values, answers }
}

/** Full demo history for one crew member on one mission: one completed daily check-in per day */
export function generateDemoData(
  crew: DemoCrewMember,
  missionId: MissionProfileId,
  today: Date = new Date(),
): DemoDataset {
  const profile = demoProfile(crew, missionId, today)
  const random = createRandom(`${crew.id}:${missionId}`)
  const start = missionStart(missionId, today)

  const checkIns: CheckIn[] = []
  for (let day = 1; day <= DEMO_CURRENT_DAY[missionId]; day++) {
    // Morning check-in around 07:00–07:30
    const started = setMinutes(setHours(addDays(start, day - 1), 7), Math.floor(random.next() * 30))
    const at = started.toISOString()
    const { values, answers } = simulateDay(crew, missionId, day, random)
    const readings: Reading[] = Object.entries(values).map(([indicatorId, value]) => ({
      indicatorId,
      value,
      recordedAt: at,
    }))
    const countermeasures: CountermeasureAnswer[] = Object.entries(answers).map(
      ([questionId, answer]) => ({ questionId, answer, recordedAt: at }),
    )
    checkIns.push({
      id: `${crew.id}-${missionId}-d${day}`,
      profileId: crew.id,
      missionId,
      mode: { kind: 'daily' },
      startedAt: at,
      completedAt: new Date(started.getTime() + 2 * 60 * 1000).toISOString(),
      readings,
      countermeasures,
    })
  }

  // Events, including upcoming ones after today (e.g. the Artemis splashdown on day 30)
  const events: MissionEvent[] = DEMO_EVENTS[missionId]
    .filter((event) => involves(event, crew))
    .map((event) => ({
      id: `${crew.id}-${missionId}-e${event.day}-${event.type}`,
      profileId: crew.id,
      missionId,
      type: event.type,
      at: setHours(addDays(start, event.day - 1), 14).toISOString(),
      note: event.note,
    }))

  return { profile, checkIns, events }
}

/** Demo data for all 3 crew members on one mission */
export function generateDemoCrew(
  missionId: MissionProfileId,
  today: Date = new Date(),
): DemoDataset[] {
  return DEMO_CREW.map((crew) => generateDemoData(crew, missionId, today))
}
