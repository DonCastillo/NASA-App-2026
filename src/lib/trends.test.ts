import { describe, expect, it } from 'vitest'
import { SYSTEMS } from '../data/systems'
import type { IndicatorId, ReadingValue } from '../types'
import { scoreSystem } from './status'
import {
  type HistoryPoint,
  dailyPoints,
  driftStatus,
  recoveryStatus,
  streakStatus,
  trendDirection,
  trendStatus,
} from './trends'

const indicator = (id: IndicatorId) =>
  SYSTEMS.flatMap((system) => system.indicators).find((i) => i.id === id)!

/** One reading per day at 07:00 local time, starting 1 April 2026 */
const days = (values: ReadingValue[], startDay = 1): HistoryPoint[] =>
  values.map((value, i) => ({
    value,
    recordedAt: new Date(2026, 3, startDay + i, 7, 0).toISOString(),
  }))

describe('dailyPoints', () => {
  it('keeps the last value per day and drops skipped readings', () => {
    const history: HistoryPoint[] = [
      { value: 37.5, recordedAt: new Date(2026, 3, 1, 7).toISOString() },
      { value: 36.9, recordedAt: new Date(2026, 3, 1, 13).toISOString() }, // recheck later that day
      { value: null, recordedAt: new Date(2026, 3, 2, 7).toISOString() },
    ]
    expect(dailyPoints(history).map((p) => p.value)).toEqual([36.9])
  })
})

describe('streak rules', () => {
  it('turns exercise under 60 min for 3 days in a row red', () => {
    expect(streakStatus(indicator('exerciseMinutes'), days([95, 50, 45, 40]))).toMatchObject({
      status: 'red',
    })
  })

  it('does not count 60–89 min toward the streak (amber, but not below 60)', () => {
    expect(streakStatus(indicator('exerciseMinutes'), days([75, 70, 65]))).toBeUndefined()
  })

  it('breaks the streak on a gap day', () => {
    const history = [...days([50, 45], 1), ...days([40], 4)] // nothing on 3 April
    expect(streakStatus(indicator('exerciseMinutes'), history)).toBeUndefined()
  })

  it('turns appetite of 1–2 for 3 days red, but a 3 ("OK") does not count', () => {
    expect(streakStatus(indicator('appetite'), days([2, 1, 2]))?.status).toBe('red')
    expect(streakStatus(indicator('appetite'), days([2, 3, 2]))).toBeUndefined()
  })

  it('turns low mood (OK or worse) for 3 days red', () => {
    expect(streakStatus(indicator('mood'), days([3, 3, 3]))?.status).toBe('red')
  })

  it('turns palpitations on 2 days in a row red', () => {
    expect(streakStatus(indicator('palpitations'), days([true, true]))?.status).toBe('red')
  })
})

describe('recovery rule', () => {
  it('keeps one good temperature after 3 high days at amber', () => {
    const result = recoveryStatus(indicator('bodyTemperature'), days([37.6, 38.2, 37.8, 36.8]))
    expect(result).toMatchObject({ status: 'amber' })
  })

  it('does not apply after a single bad day', () => {
    expect(
      recoveryStatus(indicator('bodyTemperature'), days([36.7, 36.8, 37.6, 36.8])),
    ).toBeUndefined()
  })
})

describe('drift rule', () => {
  it('flags green bone loss heading toward 3% within a week', () => {
    expect(
      driftStatus(indicator('boneLossEstimate'), days([1.8, 2.0, 2.2, 2.4, 2.6])),
    ).toMatchObject({
      status: 'amber',
    })
  })

  it('ignores stable green readings', () => {
    expect(driftStatus(indicator('restingHeartRate'), days([62, 63, 61, 62, 62]))).toBeUndefined()
  })

  it('works on baseline-relative values (body mass vs preflight 70 kg)', () => {
    // −0.6% … −1.9%: still green, but losing ~0.3%/day → below −2% within a week
    expect(
      driftStatus(indicator('bodyMass'), days([69.6, 69.4, 69.2, 68.9, 68.7]), 70)?.status,
    ).toBe('amber')
  })

  it('needs at least 4 days and only applies to numbers', () => {
    expect(driftStatus(indicator('boneLossEstimate'), days([2.6, 2.8, 2.9]))).toBeUndefined()
    expect(driftStatus(indicator('headache'), days([0, 0, 0, 0, 0]))).toBeUndefined()
  })
})

describe('trendStatus + scoreSystem', () => {
  it('returns the strongest trend result', () => {
    expect(trendStatus(indicator('exerciseMinutes'), days([95, 50, 45, 40]))?.status).toBe('red')
    expect(trendStatus(indicator('restingHeartRate'), days([62, 63, 61, 62]))).toBeUndefined()
  })

  it('raises a system through scoreSystem, with the trend reason as the driver', () => {
    const bones = SYSTEMS.find((system) => system.id === 'bones')!
    const history = days([95, 50, 45, 40])
    const result = scoreSystem(
      bones,
      { exerciseMinutes: 40 },
      { trends: { exerciseMinutes: trendStatus(indicator('exerciseMinutes'), history) } },
    )
    expect(result.status).toBe('red')
    expect(result.indicators[0].raisedBy).toMatch(/3 days in a row/)
  })
})

describe('trendDirection', () => {
  it.each([
    ['restingHeartRate', [62, 62, 63, 62, 62, 63], 'flat'],
    ['restingHeartRate', [60, 60, 60, 63, 63, 63], 'slightUp'], // +5%
    ['bodyTemperature', [36.6, 36.6, 36.6, 38.4, 38.6, 38.5], 'slightUp'], // +5%
    ['bloodGlucose', [90, 92, 91, 110, 115, 112], 'up'], // +23%
    ['sleepHours', [7.5, 7.5, 7.4, 6.4, 6.2, 6.3], 'down'], // −16%
    ['mood', [4, 4, 4, 3, 3, 4], 'slightDown'], // −0.67 points
    ['mood', [4, 4], 'flat'], // not enough data
  ] as const)('%s %j → %s', (id, values, expected) => {
    expect(trendDirection(indicator(id), days([...values]))).toBe(expected)
  })
})
