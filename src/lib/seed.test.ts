import { differenceInCalendarDays } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { DEMO_CREW, DEMO_CURRENT_DAY } from '../data/demoCrew'
import { MISSIONS } from '../data/missions'
import { SYSTEMS } from '../data/systems'
import type { MissionProfileId, ReadingValue } from '../types'
import { generateDemoCrew, generateDemoData } from './seed'
import { scoreSystem } from './status'
import { type HistoryPoint, trendStatus } from './trends'

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
      // The dosimeter is also read the day after each of Vega's 2 ISS spacewalks
      expect(count(id), id).toBeLessThanOrEqual(id === 'cumulativeDose' ? 20 : 18)
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

// ── 2.2: article trends and storylines, checked with the real scoring code ──

/** Score every system for one demo crew member as of today (latest values + trend rules) */
function systemStatusesToday(data: ReturnType<typeof generateDemoData>) {
  const all = SYSTEMS.flatMap((s) => s.indicators)
  const latest: Record<string, ReadingValue> = {}
  const history: Record<string, HistoryPoint[]> = {}
  for (const reading of data.checkIns.flatMap((c) => c.readings)) {
    latest[reading.indicatorId] = reading.value
    ;(history[reading.indicatorId] ??= []).push(reading)
  }
  const { baselines, preflightBodyMassKg, mission } = data.profile
  const references = {
    nearVision: baselines.nearVisionLines,
    strengthTest: baselines.strengthScore,
    bodyMass: preflightBodyMassKg,
    balanceTest: baselines.balanceSeconds,
    cumulativeDose: MISSIONS[mission.profileId].doseBudgetMilliSv,
  }
  const trends = Object.fromEntries(
    all.map((i) => [
      i.id,
      trendStatus(i, history[i.id] ?? [], references[i.id as keyof typeof references]),
    ]),
  )
  return Object.fromEntries(
    SYSTEMS.map((s) => [
      s.id,
      scoreSystem(s, latest, { references, allIndicators: all, trends }).status,
    ]),
  )
}

describe('storylines (2.2)', () => {
  it.each(MISSION_IDS)(
    'gives every crew member green, amber and at least one red on %s',
    (missionId) => {
      for (const data of generateDemoCrew(missionId, TODAY)) {
        const statuses = Object.values(systemStatusesToday(data))
        expect(statuses, data.profile.name).toContain('red')
        expect(statuses, data.profile.name).toContain('amber')
        expect(statuses, data.profile.name).toContain('green')
      }
    },
  )

  it.each(MISSION_IDS)('shows each storyline as red today on %s', (missionId) => {
    const [vega, okafor, lindqvist] = generateDemoCrew(missionId, TODAY).map(systemStatusesToday)
    expect(vega.eyes).toBe('red') // SANS: headache with a vision change
    expect(okafor.immune).toBe('red') // cold sore + 38.2 °C
    expect(lindqvist.mind).toBe('red') // 5.4 h sleep, low mood 3 days in a row
  })

  it('worsens near vision gradually for the SANS crew member', () => {
    const { checkIns } = generateDemoData(DEMO_CREW[0], 'mars', TODAY)
    const vision = checkIns.flatMap((c) => c.readings).filter((r) => r.indicatorId === 'nearVision')
    expect(vision[0].value).toBe(10) // baseline early on
    expect(vision.some((r) => r.value === 9)).toBe(true) // one line worse after onset
    expect(vision[vision.length - 1].value).toBe(8) // two lines worse by today
  })

  it('lowers strength through the mission, most for the steepest decliner', () => {
    const strength = (crewIndex: number) =>
      generateDemoData(DEMO_CREW[crewIndex], 'mars', TODAY)
        .checkIns.flatMap((c) => c.readings)
        .filter((r) => r.indicatorId === 'strengthTest')
        .map((r) => r.value as number)
    const okafor = strength(1)
    const lostPercent =
      (1 - okafor[okafor.length - 1] / DEMO_CREW[1].baselines.strengthScore!) * 100
    // Day 150 of 210 with 18% by the end → about 13% lower
    expect(lostPercent).toBeGreaterThan(10)
    expect(lostPercent).toBeLessThan(16)
  })

  it('adds spacewalk dose and reads the dosimeter the day after a spacewalk', () => {
    const { checkIns, events } = generateDemoData(DEMO_CREW[0], 'iss', TODAY)
    const spacewalkDays = events.filter((e) => e.type === 'spacewalk').length
    expect(spacewalkDays).toBe(2)
    const dayAfterFirst = checkIns[41] // mission day 42
    expect(dayAfterFirst.readings.some((r) => r.indicatorId === 'cumulativeDose')).toBe(true)
  })

  it('logs Artemis events with follow-ups and an upcoming splashdown', () => {
    const { checkIns, events } = generateDemoData(DEMO_CREW[1], 'artemis', TODAY)
    expect(events.map((e) => e.note)).toContain('Splashdown on Earth')
    expect(new Date(events[events.length - 1].at).getTime()).toBeGreaterThan(TODAY.getTime())
    const dayAfterLanding = checkIns[6] // mission day 7
    const ids = dayAfterLanding.readings.map((r) => r.indicatorId)
    expect(ids).toEqual(expect.arrayContaining(['motionSickness', 'dizziness', 'balanceTest']))
    expect(dayAfterLanding.countermeasures.map((a) => a.questionId)).toContain(
      'motionSicknessMedicine',
    )
    expect(checkIns[4].countermeasures.map((a) => a.questionId)).toEqual(
      expect.arrayContaining(['fluidLoading', 'compressionGarments']),
    ) // day before landing
  })

  it('answers routine questions only for listed supplements', () => {
    const answered = (crewIndex: number) =>
      new Set(
        generateDemoData(DEMO_CREW[crewIndex], 'iss', TODAY).checkIns.flatMap((c) =>
          c.countermeasures.map((a) => a.questionId),
        ),
      )
    expect(answered(1).has('boneMedication')).toBe(true) // Okafor lists it
    expect(answered(0).has('boneMedication')).toBe(false)
    expect(answered(2).has('dailySupplements')).toBe(false) // Lindqvist lists none
  })
})
