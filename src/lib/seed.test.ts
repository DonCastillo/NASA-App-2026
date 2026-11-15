import { differenceInCalendarDays } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { DEMO_CREW, DEMO_CURRENT_DAY } from '../data/demoCrew'
import { SYSTEMS } from '../data/systems'
import type { MissionProfileId } from '../types'
import { generateDemoCrew, generateDemoData } from './seed'

const TODAY = new Date(2026, 10, 15, 9, 0) // 15 Nov 2026, 09:00 local
const MISSION_IDS: MissionProfileId[] = ['iss', 'artemis', 'mars']
const indicators = new Map(SYSTEMS.flatMap((s) => s.indicators).map((i) => [i.id, i]))

describe('demo crew', () => {
  it('has 3 demo profiles with the profile fields and baselines from setup', () => {
    expect(DEMO_CREW).toHaveLength(3)
    for (const crew of DEMO_CREW) {
      expect(crew.isDemo).toBe(true)
      expect(crew.age).toBeGreaterThan(0)
      expect(crew.heightCm).toBeGreaterThan(0)
      expect(crew.preflightBodyMassKg).toBeGreaterThan(0)
      expect(Object.keys(crew.baselines)).toHaveLength(7)
    }
  })
})

describe('generateDemoData', () => {
  it('is deterministic: same crew + mission + date → identical data', () => {
    const a = generateDemoData(DEMO_CREW[0], 'mars', TODAY)
    const b = generateDemoData(DEMO_CREW[0], 'mars', TODAY)
    expect(a).toEqual(b)
  })

  it('keeps the same values when only the date changes', () => {
    const today = generateDemoData(DEMO_CREW[1], 'iss', TODAY)
    const tomorrow = generateDemoData(DEMO_CREW[1], 'iss', new Date(2026, 10, 16, 9, 0))
    const values = (data: typeof today) => data.checkIns.map((c) => c.readings.map((r) => r.value))
    expect(values(tomorrow)).toEqual(values(today))
  })

  it.each(MISSION_IDS)(
    'runs from day 1 to the seeded current day on %s, ending today',
    (missionId) => {
      const { profile, checkIns } = generateDemoData(DEMO_CREW[2], missionId, TODAY)
      expect(checkIns).toHaveLength(DEMO_CURRENT_DAY[missionId])
      const last = new Date(checkIns[checkIns.length - 1].startedAt)
      expect(differenceInCalendarDays(TODAY, last)).toBe(0)
      // Mission day of today = seeded current day
      expect(
        differenceInCalendarDays(TODAY, new Date(`${profile.mission.startDate}T00:00`)) + 1,
      ).toBe(DEMO_CURRENT_DAY[missionId])
      expect(profile.mission.profileId).toBe(missionId)
    },
  )

  it('records the core daily items every day and each weekly item once a week', () => {
    const { checkIns } = generateDemoData(DEMO_CREW[0], 'iss', TODAY)
    const count = (id: string) =>
      checkIns.filter((c) => c.readings.some((r) => r.indicatorId === id)).length
    for (const id of [
      'bloodPressure',
      'restingHeartRate',
      'bodyTemperature',
      'sleepHours',
      'mood',
      'exerciseMinutes',
    ]) {
      expect(count(id), id).toBe(120)
    }
    for (const id of [
      'nearVision',
      'strengthTest',
      'bodyMass',
      'bloodGlucose',
      'cumulativeDose',
      'crewRelations',
    ]) {
      expect(count(id), id).toBeGreaterThanOrEqual(17) // 120 days ≈ 17 weeks
      expect(count(id), id).toBeLessThanOrEqual(18)
    }
  })

  it('only produces values inside each indicator’s plausible range', () => {
    for (const data of generateDemoCrew('mars', TODAY)) {
      for (const reading of data.checkIns.flatMap((c) => c.readings)) {
        const indicator = indicators.get(reading.indicatorId)!
        const values = Array.isArray(reading.value) ? reading.value : [reading.value]
        for (const value of values) {
          if (typeof value === 'number' && indicator.plausible) {
            expect(value, reading.indicatorId).toBeGreaterThanOrEqual(indicator.plausible.min)
            expect(value, reading.indicatorId).toBeLessThanOrEqual(indicator.plausible.max)
          }
        }
      }
    }
  })

  it('gives each crew member different values', () => {
    const [a, b] = generateDemoCrew('artemis', TODAY)
    expect(a.checkIns[0].readings).not.toEqual(b.checkIns[0].readings)
  })
})
