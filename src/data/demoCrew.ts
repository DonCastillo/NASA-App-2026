import type { MissionEventType, MissionProfileId, Profile } from '../types'

// The 3 seeded demo crew members (plan/tasks.md 2.1–2.2). Fictional people, illustrative values.
// Their mission settings are filled in per mission by src/lib/seed.ts, so the same crew can be shown
// on ISS, Artemis lunar or Mars transit.

/**
 * Each demo crew member follows one storyline from the articles, so the demo shows red, amber and green:
 * - sans:   gradual SANS onset (near vision worsens, headaches, blur) — Eyes & brain
 * - immune: dormant virus reactivates (cold sore, rising temperature) — Immune
 * - sleep:  disrupted sleep and mood dips — Mind & sleep
 */
export type DemoStory = 'sans' | 'immune' | 'sleep'

export type DemoCrewMember = Omit<Profile, 'mission'> & {
  story: DemoStory
  /** Share of strength lost by the end of the mission (articles: 10–12% on average, some lose >20%) */
  strengthLossByEnd: number
}

export const DEMO_CREW: DemoCrewMember[] = [
  {
    id: 'demo-vega',
    name: 'Cmdr. Vega',
    isDemo: true,
    age: 44,
    sex: 'female',
    heightCm: 168,
    preflightBodyMassKg: 63,
    supplements: ['bVitamin'],
    story: 'sans',
    strengthLossByEnd: 0.11,
    baselines: {
      restingSystolic: 118,
      restingDiastolic: 76,
      restingHeartRate: 58,
      strengthScore: 60,
      nearVisionLines: 10,
      balanceSeconds: 30,
      typicalSleepHours: 7.3,
    },
  },
  {
    id: 'demo-okafor',
    name: 'Dr. Okafor',
    isDemo: true,
    age: 39,
    sex: 'male',
    heightCm: 180,
    preflightBodyMassKg: 78,
    supplements: ['bVitamin', 'boneMedication'],
    story: 'immune',
    strengthLossByEnd: 0.18,
    baselines: {
      restingSystolic: 122,
      restingDiastolic: 80,
      restingHeartRate: 64,
      strengthScore: 75,
      nearVisionLines: 10,
      balanceSeconds: 28,
      typicalSleepHours: 7.0,
    },
  },
  {
    id: 'demo-lindqvist',
    name: 'Eng. Lindqvist',
    isDemo: true,
    age: 36,
    sex: 'female',
    heightCm: 172,
    preflightBodyMassKg: 66,
    supplements: [],
    story: 'sleep',
    strengthLossByEnd: 0.1,
    baselines: {
      restingSystolic: 115,
      restingDiastolic: 72,
      restingHeartRate: 55,
      strengthScore: 68,
      nearVisionLines: 9,
      balanceSeconds: 34,
      typicalSleepHours: 7.5,
    },
  },
]

/** The seeded "today" for each mission: history runs from day 1 to this day (plan/tasks.md 2.1) */
export const DEMO_CURRENT_DAY: Record<MissionProfileId, number> = {
  iss: 120, // of 180
  artemis: 20, // of 30
  mars: 150, // of 210
}

/** A scripted event in the demo history. Days after the seeded current day are upcoming. */
export type DemoEvent = {
  day: number
  type: MissionEventType
  /** Crew member ids, or 'all' */
  crew: string[] | 'all'
  note: string
}

/** Mission events for the demo crew, with chart markers and follow-up checks (plan/tasks.md 2.2) */
export const DEMO_EVENTS: Record<MissionProfileId, DemoEvent[]> = {
  iss: [
    {
      day: 41,
      type: 'spacewalk',
      crew: ['demo-vega', 'demo-lindqvist'],
      note: 'Battery swap on the truss',
    },
    { day: 97, type: 'spacewalk', crew: ['demo-vega', 'demo-lindqvist'], note: 'Antenna repair' },
  ],
  artemis: [
    { day: 6, type: 'landing', crew: 'all', note: 'Lunar landing' },
    { day: 8, type: 'spacewalk', crew: ['demo-vega', 'demo-okafor'], note: 'First moonwalk' },
    { day: 11, type: 'spacewalk', crew: ['demo-vega', 'demo-okafor'], note: 'Second moonwalk' },
    { day: 14, type: 'gravityTransition', crew: 'all', note: 'Ascent from the Moon' },
    { day: 30, type: 'landing', crew: 'all', note: 'Splashdown on Earth' }, // upcoming
  ],
  mars: [{ day: 88, type: 'spacewalk', crew: ['demo-lindqvist'], note: 'Radiator repair' }],
}
