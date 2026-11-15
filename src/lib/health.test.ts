import { describe, expect, it } from 'vitest'
import { DEMO_CREW } from '../data/demoCrew'
import { MISSIONS } from '../data/missions'
import type { CheckIn, Profile } from '../types'
import { computeHealth } from './health'
import { generateDemoData } from './seed'

const TODAY = new Date(2026, 10, 15, 9, 0)

const healthOf = (crewIndex: number, missionId: 'iss' | 'artemis' | 'mars') => {
  const data = generateDemoData(DEMO_CREW[crewIndex], missionId, TODAY)
  return computeHealth(data, MISSIONS[missionId], TODAY)
}

describe('computeHealth', () => {
  it('scores all 8 systems, with readiness counts and the most urgent system', () => {
    const health = healthOf(0, 'mars') // Vega: SANS storyline
    expect(Object.keys(health.systems)).toHaveLength(8)
    const total = Object.values(health.readiness).reduce((a, b) => a + b, 0)
    expect(total).toBe(8)
    expect(health.systems.eyes.status).toBe('red')
    // Near vision (2 lines worse, red) comes first in the system, so it drives the sentence
    expect(health.systems.eyes.reason).toBe('Near-vision self-check: 8 lines')
    expect(health.mostUrgent).toMatchObject({ status: 'red' })
  })

  it('reports mission day, comms delay, dose and projections', () => {
    const health = healthOf(2, 'mars')
    expect(health.progress.day).toBe(150)
    expect(health.commsDelaySeconds).toBeCloseTo((150 / 210) * 1200, 0)
    expect(health.dose.percentOfBudget).toBeGreaterThan(50)
    expect(health.projections.doseMilliSv).toBeGreaterThan(health.dose.latestMilliSv!)
  })

  it('adds the calculated indicators: bone-loss estimate and dose rate', () => {
    const health = healthOf(0, 'iss')
    expect(health.latest.boneLossEstimate).toBeGreaterThan(2)
    expect(health.history.boneLossEstimate).toHaveLength(120)
    expect(health.latest.doseRate).toBeGreaterThan(0)
    expect(health.systems.radiation.status).not.toBe('none')
  })

  it('ignores stale readings: an old follow-up does not colour a system forever', () => {
    const profile: Profile = {
      id: 'me',
      name: 'Me',
      isDemo: false,
      supplements: [],
      baselines: {},
      mission: { profileId: 'iss', startDate: '2026-10-01', lengthDays: 180 },
    }
    const at = (day: number) => new Date(2026, 10, day, 8).toISOString()
    const checkIns: CheckIn[] = [
      {
        id: 'old',
        profileId: 'me',
        mode: { kind: 'daily' },
        startedAt: at(1),
        readings: [{ indicatorId: 'headache', value: 2, recordedAt: at(1) }], // 2 weeks ago
        countermeasures: [],
      },
      {
        id: 'today',
        profileId: 'me',
        mode: { kind: 'daily' },
        startedAt: at(15),
        readings: [{ indicatorId: 'restingHeartRate', value: 60, recordedAt: at(15) }],
        countermeasures: [],
      },
    ]
    const health = computeHealth({ profile, checkIns, events: [] }, MISSIONS.iss, TODAY)
    expect(health.latest.headache).toBeUndefined()
    expect(health.systems.eyes.status).toBe('none')
    expect(health.systems.heart.status).toBe('green')
  })

  it('gives each storyline its red system on every mission', () => {
    for (const missionId of ['iss', 'artemis', 'mars'] as const) {
      expect(healthOf(0, missionId).systems.eyes.status, missionId).toBe('red')
      expect(healthOf(1, missionId).systems.immune.status, missionId).toBe('red')
      expect(healthOf(2, missionId).systems.mind.status, missionId).toBe('red')
    }
  })
})
