import { describe, expect, it } from 'vitest'
import { SYSTEMS } from '../data/systems'
import type { IndicatorId } from '../types'
import { formatDelay, formatNumber, formatReading } from './format'

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
