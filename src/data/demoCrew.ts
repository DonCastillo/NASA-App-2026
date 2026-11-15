import type { MissionProfileId, Profile } from '../types'

// The 3 seeded demo crew members (plan/tasks.md 2.1). Fictional people, illustrative values.
// Their mission settings are filled in per mission by src/lib/seed.ts, so the same crew can be shown
// on ISS, Artemis lunar or Mars transit.
export type DemoCrewMember = Omit<Profile, 'mission'>

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
