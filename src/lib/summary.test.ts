import { describe, expect, it } from 'vitest'
import { DEMO_CREW } from '../data/demoCrew'
import { MISSIONS } from '../data/missions'
import type { SystemId } from '../types'
import { type Health, computeHealth } from './health'
import { generateDemoData } from './seed'
import { formatDuration, rechecksFor, statusChanges } from './summary'

const TODAY = new Date(2026, 10, 15, 9, 0)
const base = computeHealth(generateDemoData(DEMO_CREW[0], 'mars', TODAY), MISSIONS.mars, TODAY)

/** A copy of the health picture with some systems' status (and driver) changed */
function withSystem(
  health: Health,
  id: SystemId,
  status: 'green' | 'amber' | 'red',
  driverId?: string,
): Health {
  return {
    ...health,
    systems: {
      ...health.systems,
      [id]: { ...health.systems[id], status, driverId, reason: `${id} reason` },
    },
  }
}

describe('statusChanges', () => {
  it('lists only systems whose status changed, worst first, with the first action', () => {
    const before = withSystem(withSystem(base, 'immune', 'green'), 'heart', 'green')
    const after = withSystem(
      withSystem(base, 'immune', 'red', 'bodyTemperature'),
      'heart',
      'amber',
      'restingHeartRate',
    )
    const changes = statusChanges(before, after)
    expect(changes.map((c) => [c.system.id, c.from, c.to])).toEqual([
      ['immune', 'green', 'red'],
      ['heart', 'green', 'amber'],
    ])
    expect(changes[0].firstAction).toBe('Run the onboard infection protocol.')
    expect(changes[0].reason).toBe('immune reason')
  })

  it('has no action for a system that recovered', () => {
    const changes = statusChanges(
      withSystem(base, 'immune', 'red'),
      withSystem(base, 'immune', 'green'),
    )
    expect(changes[0]).toMatchObject({ to: 'green', firstAction: undefined })
  })

  it('is empty when nothing changed', () => {
    expect(statusChanges(base, base)).toEqual([])
  })
})

describe('rechecksFor', () => {
  it('suggests a recheck for the driving indicator, with its interval', () => {
    const after = withSystem(
      withSystem(
        withSystem(base, 'immune', 'red', 'bodyTemperature'),
        'heart',
        'amber',
        'bloodPressure',
      ),
      'mind',
      'amber',
      'sleepHours',
    )
    const before = withSystem(
      withSystem(withSystem(base, 'immune', 'green'), 'heart', 'green'),
      'mind',
      'green',
    )
    expect(rechecksFor(statusChanges(before, after), after).map((r) => r.text)).toEqual([
      'Recheck body temperature in 4–6 h',
      'Recheck blood pressure within 1 h',
      'Recheck sleep duration tomorrow',
    ])
  })

  it('does not suggest rechecking calculated values', () => {
    const after = withSystem(base, 'bones', 'red', 'boneLossEstimate')
    const before = withSystem(base, 'bones', 'green')
    expect(rechecksFor(statusChanges(before, after), after)).toEqual([])
  })
})

describe('formatDuration', () => {
  it.each([
    [45_000, '45 s'],
    [108_000, '1 min 48 s'],
    [120_000, '2 min'],
    [725_000, '12 min'],
  ])('%s ms → %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected)
  })
})
