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

  it('sets the one-way comms delay for each mission', () => {
    // ISS: near real time (under 1 s)
    expect(MISSIONS.iss.commsDelay.kind).toBe('fixed')
    expect(
      MISSIONS.iss.commsDelay.kind === 'fixed' && MISSIONS.iss.commsDelay.seconds,
    ).toBeLessThan(1)
    // Artemis: ~1.3 s
    expect(MISSIONS.artemis.commsDelay).toEqual({ kind: 'fixed', seconds: 1.3 })
    // Mars transit: grows to ~20 min by arrival
    expect(MISSIONS.mars.commsDelay).toEqual({ kind: 'growing', maxSeconds: 1200 })
  })

  it('sets a daily radiation rate that rises farther from Earth', () => {
    // ISS total ≈ 150 µSv/day of neutrons ÷ 30% (radi-n2 article) ≈ 500 µSv/day
    expect(MISSIONS.iss.radiationPerDayMicroSv).toBe(500)
    expect(MISSIONS.artemis.radiationPerDayMicroSv).toBeGreaterThan(
      MISSIONS.iss.radiationPerDayMicroSv,
    )
    expect(MISSIONS.mars.radiationPerDayMicroSv).toBeGreaterThan(
      MISSIONS.artemis.radiationPerDayMicroSv,
    )
  })

  it('sizes each dose budget so a normal mission ends below red (80%)', () => {
    for (const mission of MISSION_LIST) {
      const fullMissionMilliSv = (mission.radiationPerDayMicroSv * mission.defaultLengthDays) / 1000
      const percentOfBudget = (fullMissionMilliSv / mission.doseBudgetMilliSv) * 100
      expect(percentOfBudget, mission.id).toBeGreaterThan(0)
      expect(percentOfBudget, mission.id).toBeLessThan(80)
    }
  })

  it('words escalation for every status, more self-reliant farther from Earth', () => {
    for (const mission of MISSION_LIST) {
      for (const status of ['green', 'amber', 'red'] as const) {
        expect(mission.escalation[status].length, `${mission.id} ${status}`).toBeGreaterThan(0)
      }
    }
    // Red differs by distance: call now on the ISS, act first on Mars
    expect(MISSIONS.iss.escalation.red).toMatch(/call the flight surgeons now/i)
    expect(MISSIONS.mars.escalation.red).toMatch(/^start the onboard protocol first/i)
    expect(new Set(MISSION_LIST.map((mission) => mission.escalation.red)).size).toBe(3)
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
