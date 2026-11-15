import { describe, expect, it } from 'vitest'
import { SYSTEMS } from '../data/systems'
import type { Indicator, IndicatorId, ReadingValue, Status, SystemId } from '../types'
import { scoreIndicator, scoreSystem, statusReason, worstStatus } from './status'

const ALL = SYSTEMS.flatMap((system) => system.indicators)
const indicator = (id: IndicatorId): Indicator => ALL.find((i) => i.id === id)!
const system = (id: SystemId) => SYSTEMS.find((s) => s.id === id)!
const score = (id: IndicatorId, value: ReadingValue | undefined, reference?: number) =>
  scoreIndicator(indicator(id), value, reference)

describe('worstStatus', () => {
  it('picks red over amber over green over none', () => {
    expect(worstStatus(['green', 'amber', 'none'])).toBe('amber')
    expect(worstStatus(['green', 'red', 'amber'])).toBe('red')
    expect(worstStatus(['none', 'green'])).toBe('green')
    expect(worstStatus([])).toBe('none')
  })
})

describe('scoreIndicator — sample readings for every system', () => {
  // [indicator, value, reference, expected]
  const cases: [IndicatorId, ReadingValue, number | undefined, Status][] = [
    // Heart
    ['bloodPressure', [118, 76], undefined, 'green'],
    ['bloodPressure', [135, 80], undefined, 'amber'],
    ['bloodPressure', [118, 92], undefined, 'red'], // diastolic decides
    ['bloodPressure', [80, 55], undefined, 'red'], // low systolic: fainting risk
    ['restingHeartRate', 62, undefined, 'green'],
    ['restingHeartRate', 95, undefined, 'amber'],
    ['restingHeartRate', 44, undefined, 'red'],
    ['palpitations', true, undefined, 'amber'],
    ['neckArmSwelling', true, undefined, 'red'],
    ['neckArmSwelling', false, undefined, 'green'],
    // Eyes (near vision: lines vs baseline 10)
    ['nearVision', 10, 10, 'green'],
    ['nearVision', 9, 10, 'amber'],
    ['nearVision', 8, 10, 'red'],
    ['blurredVision', 1, undefined, 'amber'],
    ['headache', 2, undefined, 'red'],
    // Bones (strength vs baseline 40 kg)
    ['exerciseMinutes', 95, undefined, 'green'],
    ['exerciseMinutes', 70, undefined, 'amber'],
    ['strengthTest', 38, 40, 'green'], // 95%
    ['strengthTest', 34, 40, 'amber'], // 85%
    ['strengthTest', 30, 40, 'red'], // 75%
    ['boneLossEstimate', 2.4, undefined, 'green'],
    ['boneLossEstimate', 5.2, undefined, 'red'],
    ['backPain', 3, undefined, 'red'],
    // Immune
    ['bodyTemperature', 36.6, undefined, 'green'],
    ['bodyTemperature', 37.3, undefined, 'amber'], // boundary: 37.3 starts amber
    ['bodyTemperature', 38.2, undefined, 'red'],
    ['immuneSymptoms', [], undefined, 'green'],
    ['immuneSymptoms', ['coldSore'], undefined, 'amber'],
    ['immuneSymptoms', ['coldSore', 'soreThroat'], undefined, 'red'],
    ['immuneSymptoms', ['spreadingRash'], undefined, 'red'], // red on its own
    // Metabolism (body mass vs preflight 70 kg)
    ['bloodGlucose', 92, undefined, 'green'],
    ['bloodGlucose', 60, undefined, 'amber'],
    ['bloodGlucose', 130, undefined, 'red'],
    ['bodyMass', 69.3, 70, 'green'], // −1%
    ['bodyMass', 67.2, 70, 'amber'], // −4%
    ['bodyMass', 65.8, 70, 'red'], // −6%
    ['appetite', 4, undefined, 'green'],
    ['appetite', 2, undefined, 'amber'], // red only after 3 days (trends.ts)
    ['mealsCompleted', 70, undefined, 'red'],
    // Mind
    ['sleepHours', 7.5, undefined, 'green'],
    ['sleepHours', 6.5, undefined, 'amber'],
    ['sleepHours', 5, undefined, 'red'],
    ['mood', 2, undefined, 'red'],
    ['stress', 1, undefined, 'green'], // reversed scale
    ['stress', 5, undefined, 'red'],
    ['crewRelations', 3, undefined, 'amber'],
    // Balance (balance test vs baseline 30 s)
    ['motionSickness', 3, undefined, 'red'],
    ['dizziness', 0, undefined, 'green'],
    ['balanceTest', 27, 30, 'green'], // −10%
    ['balanceTest', 21, 30, 'amber'], // −30%
    ['balanceTest', 15, 30, 'red'], // −50%
    // Radiation (dose vs budget 500 mSv; rate vs normal 1800 µSv/day)
    ['cumulativeDose', 155, 500, 'green'], // 31%
    ['cumulativeDose', 270, 500, 'amber'], // 54%
    ['cumulativeDose', 420, 500, 'red'], // 84%
    ['doseRate', 1800, 1800, 'green'],
    ['doseRate', 6000, 1800, 'red'], // 3.3× — solar particle event
    ['solarParticleEvent', 1, undefined, 'amber'],
  ]

  it.each(cases)('%s = %j (ref %s) → %s', (id, value, reference, expected) => {
    expect(score(id, value, reference)).toBe(expected)
  })
})

describe('scoreIndicator — missing or invalid data', () => {
  it('treats skipped and missing readings as not recorded', () => {
    expect(score('bodyTemperature', null)).toBe('none')
    expect(score('bodyTemperature', undefined)).toBe('none')
  })

  it('cannot score a baseline-relative reading without its reference', () => {
    expect(score('strengthTest', 34)).toBe('none')
    expect(score('strengthTest', 34, 0)).toBe('none')
  })

  it('ignores values of the wrong shape', () => {
    expect(score('bodyTemperature', true)).toBe('none')
    expect(score('bloodPressure', 120)).toBe('none')
    expect(score('palpitations', 1)).toBe('none')
  })
})

describe('scoreSystem', () => {
  it('takes the worst indicator and names it as the driver', () => {
    const result = scoreSystem(system('immune'), { bodyTemperature: 37.5, immuneSymptoms: [] })
    expect(result.status).toBe('amber')
    expect(result.driverId).toBe('bodyTemperature')
  })

  it('is "none" when nothing is recorded, and ignores skipped indicators', () => {
    expect(scoreSystem(system('heart'), {}).status).toBe('none')
    expect(scoreSystem(system('heart'), { restingHeartRate: 62, palpitations: null }).status).toBe(
      'green',
    )
  })

  it('uses references for baseline-relative indicators', () => {
    const result = scoreSystem(
      system('bones'),
      { strengthTest: 30 },
      { references: { strengthTest: 40 } },
    )
    expect(result.status).toBe('red')
  })
})

describe('cross rules', () => {
  it('raises a headache with a vision change to red', () => {
    const result = scoreSystem(system('eyes'), { headache: 1, blurredVision: 1 })
    expect(result.status).toBe('red')
    expect(result.indicators.find((r) => r.indicatorId === 'headache')).toMatchObject({
      status: 'red',
      raisedBy: 'Headache with a vision change',
    })
  })

  it('raises fever with symptoms to red, but not symptoms alone', () => {
    const withFever = scoreSystem(system('immune'), {
      bodyTemperature: 38.1,
      immuneSymptoms: ['cough'],
    })
    expect(withFever.indicators.find((r) => r.indicatorId === 'immuneSymptoms')?.status).toBe('red')
    const noFever = scoreSystem(system('immune'), {
      bodyTemperature: 36.8,
      immuneSymptoms: ['cough'],
    })
    expect(noFever.status).toBe('amber')
  })

  it('looks across systems: palpitations with dizziness (balance) is red', () => {
    const all = SYSTEMS.flatMap((s) => s.indicators)
    const result = scoreSystem(
      system('heart'),
      { palpitations: true, dizziness: 1 },
      { allIndicators: all },
    )
    expect(result.status).toBe('red')
  })
})

describe('statusReason', () => {
  it('describes the driving reading, a cross rule, or the overall state', () => {
    const immune = system('immune')
    const latest = { bodyTemperature: 38.2, immuneSymptoms: [] }
    expect(statusReason(immune, scoreSystem(immune, latest), latest)).toBe(
      'Body temperature: 38.2 °C',
    )

    const fever = { bodyTemperature: 38.2, immuneSymptoms: ['cough'] }
    // Temperature is red first in order, so it drives the sentence
    expect(statusReason(immune, scoreSystem(immune, fever), fever)).toBe(
      'Body temperature: 38.2 °C',
    )

    const eyes = system('eyes')
    const vision = { headache: 1, blurredVision: 1 }
    expect(statusReason(eyes, scoreSystem(eyes, vision), vision)).toBe(
      'Headache with a vision change',
    )

    expect(statusReason(immune, scoreSystem(immune, {}), {})).toBe('Nothing recorded yet.')
    const fine = { bodyTemperature: 36.6 }
    expect(statusReason(immune, scoreSystem(immune, fine), fine)).toBe(
      'All recorded indicators are in range.',
    )
  })
})
