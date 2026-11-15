import { describe, expect, it } from 'vitest'
import { DEMO_CREW, DEMO_CURRENT_DAY } from '../data/demoCrew'
import { MISSIONS } from '../data/missions'
import type { MissionSettings, Profile } from '../types'
import {
  boneLossByDay,
  collectHistory,
  commsDelaySeconds,
  doseSummary,
  effectiveBaselines,
  missionProgress,
  projections,
  referencesFor,
} from './derived'
import { generateDemoData } from './seed'
import type { HistoryPoint } from './trends'

const TODAY = new Date(2026, 10, 15, 9, 0) // 15 Nov 2026, 09:00 local
const MARS: MissionSettings = { profileId: 'mars', startDate: '2026-09-30', lengthDays: 210 }

/** One reading per day at 07:00 local, starting on the given date */
const daily = (values: unknown[], start = new Date(2026, 8, 30)): HistoryPoint[] =>
  values.map((value, i) => ({
    value: value as HistoryPoint['value'],
    recordedAt: new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + i,
      7,
    ).toISOString(),
  }))

describe('missionProgress', () => {
  it('counts the start date as day 1', () => {
    expect(missionProgress(MARS, new Date(2026, 8, 30, 23, 0)).day).toBe(1)
    // 30 Sep → 15 Nov is 46 days later → day 47
    expect(missionProgress(MARS, TODAY)).toMatchObject({ day: 47, lengthDays: 210, daysLeft: 163 })
    expect(missionProgress(MARS, TODAY).progress).toBeCloseTo(47 / 210)
  })

  it('matches the seeded current day for demo profiles', () => {
    const { profile } = generateDemoData(DEMO_CREW[0], 'iss', TODAY)
    expect(missionProgress(profile.mission, TODAY).day).toBe(DEMO_CURRENT_DAY.iss)
  })
})

describe('commsDelaySeconds', () => {
  it('is fixed for ISS and Artemis, and grows to 20 min on Mars', () => {
    expect(commsDelaySeconds(MISSIONS.iss, 100, 180)).toBe(0.5)
    expect(commsDelaySeconds(MISSIONS.artemis, 5, 30)).toBe(1.3)
    expect(commsDelaySeconds(MISSIONS.mars, 47, 210)).toBeCloseTo(268.6, 0) // ≈ 4.5 min
    expect(commsDelaySeconds(MISSIONS.mars, 210, 210)).toBe(1200)
    expect(commsDelaySeconds(MISSIONS.mars, 400, 210)).toBe(1200) // never beyond the maximum
  })
})

describe('boneLossByDay', () => {
  it('loses about 1.5%/month with no exercise and 0.6%/month at full compliance', () => {
    const thirtyDays = new Date(2026, 9, 29, 9) // mission day 30
    const none = boneLossByDay(MARS, daily(Array(30).fill(0)), thirtyDays)
    const full = boneLossByDay(MARS, daily(Array(30).fill(95)), thirtyDays)
    expect(none).toHaveLength(30)
    expect(none[29].value).toBeCloseTo(1.5, 1)
    expect(full[29].value).toBeCloseTo(0.6, 1)
  })

  it('fills days without an exercise reading with the average compliance', () => {
    const thirtyDays = new Date(2026, 9, 29, 9)
    const gappy = boneLossByDay(MARS, daily([95, null, 95, null]), thirtyDays)
    expect(gappy[29].value).toBeCloseTo(0.6, 1)
  })

  it('keeps the seeded ISS crew in the green after 4 months of good exercise', () => {
    const { profile, checkIns } = generateDemoData(DEMO_CREW[0], 'iss', TODAY)
    const series = boneLossByDay(profile.mission, collectHistory(checkIns).exerciseMinutes, TODAY)
    expect(series).toHaveLength(120)
    const latest = series[series.length - 1].value as number
    expect(latest).toBeGreaterThan(2)
    expect(latest).toBeLessThan(3) // green: under 3%
  })
})

describe('doseSummary', () => {
  it('gives the latest dose, % of budget and the measured daily rate', () => {
    const history = daily([10, null, null, null, null, null, null, 23]) // 7 days apart
    const summary = doseSummary(MISSIONS.mars, history)
    expect(summary.latestMilliSv).toBe(23)
    expect(summary.percentOfBudget).toBeCloseTo(4.6)
    expect(summary.ratePerDayMicroSv).toBeCloseTo(1857, 0)
  })

  it('has no rate with a single reading, and nothing without readings', () => {
    expect(doseSummary(MISSIONS.iss, daily([5])).ratePerDayMicroSv).toBeUndefined()
    expect(doseSummary(MISSIONS.iss, [])).toEqual({})
  })
})

describe('effectiveBaselines + referencesFor', () => {
  it('keeps baselines from setup', () => {
    const { profile, checkIns } = generateDemoData(DEMO_CREW[0], 'mars', TODAY)
    expect(effectiveBaselines(profile, collectHistory(checkIns))).toEqual(profile.baselines)
  })

  it('fills missing baselines from the average of the first 7 days', () => {
    const profile: Profile = {
      id: 'me',
      name: 'Me',
      isDemo: false,
      supplements: [],
      baselines: {},
      mission: MARS,
    }
    const history = {
      bloodPressure: daily([
        [120, 80],
        [124, 78],
        [116, 82],
      ]),
      restingHeartRate: daily([60, 62, 64, 66, 68, 70, 72, 99]), // day 8 (99) is not in the first week
    }
    const baselines = effectiveBaselines(profile, history)
    expect(baselines.restingSystolic).toBe(120)
    expect(baselines.restingDiastolic).toBe(80)
    expect(baselines.restingHeartRate).toBe(66)
    expect(baselines.strengthScore).toBeUndefined() // no data → stays missing
  })

  it('gives each baseline/budget/rate-relative indicator its reference', () => {
    const { profile, checkIns } = generateDemoData(DEMO_CREW[1], 'mars', TODAY)
    const history = collectHistory(checkIns)
    const references = referencesFor(
      profile,
      effectiveBaselines(profile, history),
      MISSIONS.mars,
      history,
    )
    expect(references).toEqual({
      nearVision: 10,
      strengthTest: 75,
      balanceTest: 28,
      bodyMass: 78,
      cumulativeDose: 500,
      doseRate: 1800,
    })
  })
})

describe('projections', () => {
  it('projects bone loss and dose to the end of the mission', () => {
    const { profile, checkIns } = generateDemoData(DEMO_CREW[2], 'mars', TODAY)
    const history = collectHistory(checkIns)
    const boneLoss = boneLossByDay(profile.mission, history.exerciseMinutes, TODAY)
    const dose = doseSummary(MISSIONS.mars, history.cumulativeDose)
    const result = projections(profile.mission, MISSIONS.mars, boneLoss, dose, TODAY)

    const boneNow = boneLoss[boneLoss.length - 1].value as number
    expect(result.boneLossPercent).toBeGreaterThan(boneNow) // keeps rising for 60 more days
    expect(result.boneLossPercent).toBeLessThan(boneNow * 1.6)

    // Day 150 → 210 at ~1800 µSv/day: about 270 + 108 ≈ 380 mSv, ~76% of the 500 mSv budget
    expect(result.doseMilliSv).toBeGreaterThan(350)
    expect(result.doseMilliSv).toBeLessThan(410)
    expect(result.dosePercentOfBudget).toBeLessThan(85)
  })

  it('projects dose from the date of the latest reading, even if it is days old', () => {
    // Readings on mission days 1 and 8 (rate 1000 µSv/day); today is day 47; mission ends on day 210
    const history = daily([10, null, null, null, null, null, null, 17])
    const result = projections(MARS, MISSIONS.mars, [], doseSummary(MISSIONS.mars, history), TODAY)
    // 17 mSv on day 8 + 202 more days × 1 mSv = 219 mSv (not 17 + 163 days left from today)
    expect(result.doseMilliSv).toBe(219)
  })
})
