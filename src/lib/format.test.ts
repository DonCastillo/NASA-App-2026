import { describe, expect, it } from 'vitest'
import { SYSTEMS } from '../data/systems'
import type { IndicatorId } from '../types'
import { describeReading, formatDelay, formatNumber, formatReading } from './format'

const indicator = (id: IndicatorId) =>
  SYSTEMS.flatMap((system) => system.indicators).find((i) => i.id === id)!

describe('formatNumber', () => {
  it('shows whole numbers as is and others with one decimal', () => {
    expect(formatNumber(62)).toBe('62')
    expect(formatNumber(38.25)).toBe('38.3')
  })
})

describe('formatReading', () => {
  it.each([
    ['bodyTemperature', 38.2, '38.2 °C'],
    ['bloodPressure', [118, 76], '118/76 mmHg'],
    ['mealsCompleted', 80, '80%'],
    ['neckArmSwelling', true, 'Yes'],
    ['immuneSymptoms', ['coldSore', 'cough'], 'Cold sore, Cough'],
    ['immuneSymptoms', [], 'None'],
    ['headache', 2, 'Moderate'],
    ['mood', 4, 'Good'],
    ['stress', 5, 'Overwhelmed'], // custom scale words
    ['motionSickness', 3, 'Vomiting'],
    ['sleepHours', null, 'Not recorded'],
  ] as const)('%s %j → %s', (id, value, expected) => {
    expect(formatReading(indicator(id), value as never)).toBe(expected)
  })
})

describe('formatDelay', () => {
  it.each([
    [0.5, 'under 1 s'],
    [1.3, '1.3 s'],
    [268, '4 min'],
    [1200, '20 min'],
  ])('%s s → %s', (seconds, expected) => {
    expect(formatDelay(seconds)).toBe(expected)
  })
})

describe('describeReading', () => {
  it.each([
    ['nearVision', 8, 10, '2 lines worse than baseline'],
    ['nearVision', 10, 10, 'same as baseline'],
    ['nearVision', 11, 10, '1 line better than baseline'],
    ['nearVision', 9, 10, '1 line worse than baseline'],
    ['strengthTest', 34, 40, '85% of baseline'],
    ['bodyMass', 67.2, 70, '−4% vs preflight'],
    ['bodyMass', 70.7, 70, '+1% vs preflight'],
    ['cumulativeDose', 270, 500, '54% of mission budget'],
    ['doseRate', 6000, 1800, '3.3× the normal rate'],
  ] as const)('%s %s vs %s → %s', (id, value, reference, expected) => {
    expect(describeReading(indicator(id), value, reference)).toBe(expected)
  })

  it('falls back to the plain reading without a reference or for plain indicators', () => {
    expect(describeReading(indicator('nearVision'), 8)).toBe('8 lines')
    expect(describeReading(indicator('bodyTemperature'), 38.2, 37)).toBe('38.2 °C')
  })
})
