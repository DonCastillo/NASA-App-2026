import { describe, expect, it } from 'vitest'
import { SYSTEMS } from '../data/systems'
import type { CheckIn, IndicatorId, MissionEvent } from '../types'
import {
  chartBaseline,
  chartMarkers,
  missionDayOf,
  numberSeries,
  rangeStartDay,
  rawBands,
  statusTimeline,
  yDomain,
} from './chart'
import type { HistoryPoint } from './trends'

const indicator = (id: IndicatorId) =>
  SYSTEMS.flatMap((s) => s.indicators).find((i) => i.id === id)!
const TODAY = new Date(2026, 10, 15, 9, 0) // mission day 150
const CURRENT = 150
/** A reading on a given mission day at 07:00 */
const onDay = (day: number) => new Date(2026, 10, 15 - (CURRENT - day), 7).toISOString()
const points = (values: [number, unknown][]): HistoryPoint[] =>
  values.map(([day, value]) => ({ value: value as HistoryPoint['value'], recordedAt: onDay(day) }))

describe('ranges and mission days', () => {
  it('starts each range on the right mission day', () => {
    expect(rangeStartDay('7d', 150)).toBe(144)
    expect(rangeStartDay('30d', 150)).toBe(121)
    expect(rangeStartDay('mission', 150)).toBe(1)
    expect(rangeStartDay('30d', 12)).toBe(1) // never before day 1
  })

  it('turns a date into a mission day', () => {
    expect(missionDayOf(onDay(150), TODAY, CURRENT)).toBe(150)
    expect(missionDayOf(onDay(121), TODAY, CURRENT)).toBe(121)
  })
})

describe('rawBands', () => {
  it('keeps absolute bands as they are', () => {
    expect(rawBands(indicator('bodyTemperature')).find((b) => b.status === 'green')).toEqual({
      status: 'green',
      from: 36.1,
      to: 37.3,
    })
  })

  it('converts baseline- and budget-relative bands into raw units', () => {
    // Strength: red < 80% of a 60 kg baseline → below 48 kg
    expect(rawBands(indicator('strengthTest'), 60)[0]).toEqual({
      status: 'red',
      from: undefined,
      to: 48,
    })
    // Near vision: red is 2+ lines worse than a baseline of 10 → below 9
    expect(rawBands(indicator('nearVision'), 10)[0]).toEqual({
      status: 'red',
      from: undefined,
      to: 9,
    })
    // Dose: amber from 50% to 80% of a 500 mSv budget
    expect(rawBands(indicator('cumulativeDose'), 500)[1]).toEqual({
      status: 'amber',
      from: 250,
      to: 400,
    })
  })

  it('needs the reference for relative bands, and uses systolic bands for blood pressure', () => {
    expect(rawBands(indicator('strengthTest'))).toEqual([])
    expect(rawBands(indicator('bloodPressure'))[0]).toEqual({
      status: 'red',
      from: undefined,
      to: 85,
    })
  })
})

describe('numberSeries and yDomain', () => {
  it('keeps one point per day inside the range, and splits number pairs', () => {
    const series = numberSeries(
      points([
        [100, 36.6],
        [140, 36.8],
        [150, [118, 76]],
      ]),
      TODAY,
      CURRENT,
      121,
    )
    expect(series.map((p) => p.day)).toEqual([140, 150])
    expect(series[1]).toMatchObject({ value: 118, value2: 76 })
  })

  it('pads the y-range around the data and the baseline', () => {
    const [min, max] = yDomain(
      [
        { day: 1, value: 50, recordedAt: '' },
        { day: 2, value: 56, recordedAt: '' },
      ],
      60,
    )
    expect(min).toBeLessThan(50)
    expect(max).toBeGreaterThan(60)
  })
})

describe('chartBaseline', () => {
  it('uses the preflight reference for relative indicators and the setup baseline otherwise', () => {
    expect(chartBaseline(indicator('strengthTest'), 60, undefined)).toBe(60)
    expect(chartBaseline(indicator('restingHeartRate'), undefined, 58)).toBe(58)
    expect(chartBaseline(indicator('bloodPressure'), undefined, [118, 76])).toBe(118)
    expect(chartBaseline(indicator('cumulativeDose'), 500, undefined)).toBeUndefined() // a budget, not a baseline
  })
})

describe('statusTimeline', () => {
  it('scores each day in range and marks missing days as not recorded', () => {
    const days = statusTimeline(
      indicator('headache'),
      points([
        [148, 0],
        [150, 2],
      ]),
      TODAY,
      CURRENT,
      148,
    )
    expect(days).toEqual([
      { day: 148, status: 'green', label: 'None' },
      { day: 149, status: 'none', label: 'Not recorded' },
      { day: 150, status: 'red', label: 'Moderate' },
    ])
  })
})

describe('chartMarkers', () => {
  const events: MissionEvent[] = [
    { id: 'e1', profileId: 'p', type: 'spacewalk', at: onDay(140) },
    { id: 'e2', profileId: 'p', type: 'landing', at: onDay(90) }, // outside the 30-day range
  ]
  const checkIn = (day: number, questionId: string, answer: string): CheckIn => ({
    id: `c${day}${questionId}`,
    profileId: 'p',
    mode: { kind: 'daily' },
    startedAt: onDay(day),
    readings: [],
    countermeasures: [{ questionId, answer, recordedAt: onDay(day) }],
  })

  it('marks events in range and "yes" countermeasures related to the indicator', () => {
    const markers = chartMarkers(
      'headache',
      events,
      [
        checkIn(145, 'thighCuffs', 'Yes, under 3 h'),
        checkIn(146, 'thighCuffs', 'No'), // not marked
        checkIn(147, 'caffeine', '1 drink'), // not related to headache
      ],
      TODAY,
      CURRENT,
      121,
    )
    expect(markers).toEqual([
      { day: 140, label: 'EVA', kind: 'event' },
      { day: 145, label: 'Did you wear thigh cuffs today? Yes, under 3 h', kind: 'countermeasure' },
    ])
  })
})
