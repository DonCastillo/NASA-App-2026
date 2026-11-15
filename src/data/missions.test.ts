import { describe, expect, it } from 'vitest'
import { MISSION_LIST, MISSIONS } from './missions'

// Content checks for src/data/missions.ts (plan/roadmap.md → Mission profiles)
describe('missions content', () => {
  it('has ISS, Artemis lunar and Mars transit, in that order', () => {
    expect(MISSION_LIST.map((mission) => mission.name)).toEqual([
      'ISS',
      'Artemis lunar',
      'Mars transit',
    ])
  })

  it('keys each mission by its own id', () => {
    for (const [key, mission] of Object.entries(MISSIONS)) {
      expect(mission.id).toBe(key)
    }
  })

  it('pre-fills the default mission lengths from the roadmap', () => {
    expect(MISSIONS.iss.defaultLengthDays).toBe(180)
    expect(MISSIONS.artemis.defaultLengthDays).toBe(30)
    expect(MISSIONS.mars.defaultLengthDays).toBe(210)
  })

  it('says what each length covers: ISS stay, Artemis round trip, Mars one way', () => {
    expect(MISSION_LIST.map((mission) => mission.trip)).toEqual(['stay', 'roundTrip', 'oneWay'])
    expect(MISSIONS.mars.lengthCovers).toBe('One way: Earth → Mars')
    for (const mission of MISSION_LIST) {
      expect(mission.lengthCovers.length, mission.id).toBeGreaterThan(0)
    }
  })

  it('only allows resupply on the ISS', () => {
    expect(MISSION_LIST.filter((mission) => mission.resupply).map((m) => m.id)).toEqual(['iss'])
  })

  it('describes each environment', () => {
    for (const mission of MISSION_LIST) {
      expect(mission.environment.length, mission.id).toBeGreaterThan(0)
    }
  })
})
