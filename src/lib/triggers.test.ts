import { describe, expect, it } from 'vitest'
import { DEMO_CREW } from '../data/demoCrew'
import { MISSIONS } from '../data/missions'
import type { CheckIn, MissionEvent, MissionProfileId, Profile } from '../types'
import { generateDemoData } from './seed'
import {
  type Answers,
  type CheckInContext,
  CORE_INDICATORS,
  buildCheckIn,
  buildQuestions,
  taskIndicatorIds,
  weeklyDue,
} from './triggers'

const NOW = new Date(2026, 10, 15, 8, 0)

const profile = (supplements: string[] = [], missionId: MissionProfileId = 'iss'): Profile => ({
  id: 'me',
  name: 'Me',
  isDemo: false,
  supplements,
  baselines: { restingSystolic: 118, restingDiastolic: 76 },
  mission: { profileId: missionId, startDate: '2026-11-01', lengthDays: 180 },
})

function ctx(overrides: Partial<CheckInContext> = {}): CheckInContext {
  const p = overrides.profile ?? profile()
  return {
    mode: { kind: 'daily' },
    profile: p,
    mission: MISSIONS[p.mission.profileId],
    now: NOW,
    references: {},
    checkIns: [],
    events: [],
    ...overrides,
  }
}

/** Question keys for the answers so far */
const keys = (c: CheckInContext, answers: Answers = {}) =>
  buildQuestions(c, answers).map((q) => q.key)

/** All-green core answers */
const calmDay: Answers = {
  bloodPressure: [118, 76],
  restingHeartRate: 60,
  bodyTemperature: 36.7,
  sleepHours: 7.5,
  mood: 4,
  exerciseMinutes: 95,
  symptoms: false,
}

/** A recent check-in that recorded every weekly item, so none are due */
const weeklyDone: CheckIn = {
  id: 'w',
  profileId: 'me',
  mode: { kind: 'daily' },
  startedAt: new Date(2026, 10, 13, 8).toISOString(),
  readings: [
    'nearVision',
    'strengthTest',
    'bodyMass',
    'bloodGlucose',
    'cumulativeDose',
    'crewRelations',
  ].map((indicatorId) => ({
    indicatorId,
    value: 1,
    recordedAt: new Date(2026, 10, 13, 8).toISOString(),
  })),
  countermeasures: [],
}

describe('daily check-in', () => {
  it('starts with the 7 core questions and ends with the note', () => {
    const list = keys(ctx({ checkIns: [weeklyDone] }))
    expect(list).toEqual([...CORE_INDICATORS, 'symptoms', 'note'])
  })

  it('asks nothing extra on a calm day', () => {
    expect(keys(ctx({ checkIns: [weeklyDone] }), calmDay)).toEqual([
      ...CORE_INDICATORS,
      'symptoms',
      'note',
    ])
  })

  it('adds weekly items that are due (not recorded in the last 7 days)', () => {
    expect(weeklyDue([], NOW)).toHaveLength(6)
    expect(weeklyDue([weeklyDone], NOW)).toEqual([])
    expect(keys(ctx(), calmDay)).toEqual(
      expect.arrayContaining(['nearVision', 'strengthTest', 'crewRelations']),
    )
  })

  it('keeps answered questions in place as follow-ups are added', () => {
    const c = ctx({ checkIns: [weeklyDone] })
    const before = keys(c, {
      bloodPressure: [118, 76],
      restingHeartRate: 60,
      bodyTemperature: 36.7,
    })
    const after = keys(c, {
      bloodPressure: [118, 76],
      restingHeartRate: 60,
      bodyTemperature: 36.7,
      sleepHours: 5.5,
    })
    expect(after.slice(0, 7)).toEqual(before.slice(0, 7))
    expect(after.length).toBeGreaterThan(before.length)
  })
})

describe('follow-up rules', () => {
  const c = ctx({ checkIns: [weeklyDone] })

  it('"yes, headache" opens the symptom list, the headache question and the thigh-cuff question', () => {
    const withList = keys(c, { ...calmDay, symptoms: true })
    expect(withList).toContain('symptomList')

    const tapped = keys(c, { ...calmDay, symptoms: true, symptomList: ['headache'] })
    expect(tapped).toContain('headache')
    expect(tapped).not.toContain('cm:thighCuffs') // only once the headache is answered

    const answered = keys(c, { ...calmDay, symptoms: true, symptomList: ['headache'], headache: 1 })
    expect(answered).toEqual(
      expect.arrayContaining(['headache', 'cm:thighCuffs', 'cm:painOrFeverMedicine']),
    )
    // Order: core → symptoms → headache → countermeasures → note
    expect(answered.indexOf('headache')).toBeGreaterThan(answered.indexOf('symptomList'))
    expect(answered.indexOf('cm:thighCuffs')).toBeGreaterThan(answered.indexOf('headache'))
    expect(answered[answered.length - 1]).toBe('note')
  })

  it('records tapped yes/no symptoms without another question', () => {
    const list = keys(c, { ...calmDay, symptoms: true, symptomList: ['palpitations'] })
    expect(list).not.toContain('palpitations')
  })

  it('asks stress and sleep quality when mood is OK or lower', () => {
    const questions = buildQuestions(c, { ...calmDay, mood: 3 })
    const stress = questions.find((q) => q.key === 'stress')
    expect(stress).toMatchObject({ kind: 'indicator', reason: 'Your mood is OK or lower' })
    expect(questions.map((q) => q.key)).toContain('sleepQuality')
    expect(keys(c, { ...calmDay, mood: 4 })).not.toContain('stress')
  })

  it('asks sleep quality under 7 h, and caffeine + bright light after a poor night', () => {
    expect(keys(c, { ...calmDay, sleepHours: 6.5 })).toContain('sleepQuality')
    expect(keys(c, { ...calmDay, sleepHours: 6.5 })).not.toContain('cm:brightLight')
    expect(keys(c, { ...calmDay, sleepHours: 5.5 })).toEqual(
      expect.arrayContaining(['sleepQuality', 'cm:caffeine', 'cm:brightLight']),
    )
  })

  it('asks the immune checklist and fever medicine from 37.3 °C', () => {
    const list = keys(c, { ...calmDay, bodyTemperature: 37.5 })
    expect(list).toEqual(expect.arrayContaining(['immuneSymptoms', 'cm:painOrFeverMedicine']))
    expect(keys(c, { ...calmDay, bodyTemperature: 37.2 })).not.toContain('immuneSymptoms')
  })

  it('opens the rest of a system when a core reading is amber or red', () => {
    const list = keys(c, { ...calmDay, bloodPressure: [135, 80] })
    expect(list).toEqual(
      expect.arrayContaining([
        'palpitations',
        'neckArmSwelling',
        'cm:caffeine',
        'cm:exerciseBeforeReading',
      ]),
    )
  })

  it('asks motion sickness and dizziness after a gravity change, plus balance on the Moon', () => {
    const landing: MissionEvent = {
      id: 'e',
      profileId: 'me',
      type: 'landing',
      at: new Date(2026, 10, 14, 14).toISOString(), // 18 h ago
    }
    expect(keys(ctx({ checkIns: [weeklyDone], events: [landing] }), calmDay)).toEqual(
      expect.arrayContaining(['motionSickness', 'dizziness']),
    )
    expect(keys(ctx({ checkIns: [weeklyDone], events: [landing] }), calmDay)).not.toContain(
      'balanceTest',
    )
    const moon = ctx({ profile: profile([], 'artemis'), checkIns: [weeklyDone], events: [landing] })
    expect(keys(moon, calmDay)).toContain('balanceTest')
    // Motion sickness answered → medicine question
    expect(keys(moon, { ...calmDay, motionSickness: 2 })).toContain('cm:motionSicknessMedicine')
  })

  it('asks the pre-landing questions in the 24 hours before a landing', () => {
    const soon: MissionEvent = {
      id: 's',
      profileId: 'me',
      type: 'landing',
      at: new Date(2026, 10, 15, 20).toISOString(), // in 12 h
    }
    expect(keys(ctx({ checkIns: [weeklyDone], events: [soon] }), calmDay)).toEqual(
      expect.arrayContaining(['cm:fluidLoading', 'cm:compressionGarments']),
    )
  })
})

describe('routine supplement questions', () => {
  it('asks only about supplements and medication the profile lists', () => {
    expect(keys(ctx({ checkIns: [weeklyDone] }), calmDay)).not.toContain('cm:dailySupplements')
    const listed = ctx({ profile: profile(['bVitamin', 'boneMedication']), checkIns: [weeklyDone] })
    expect(keys(listed, calmDay)).toEqual(
      expect.arrayContaining(['cm:dailySupplements', 'cm:boneMedication']),
    )
  })

  it('asks about weekly bone medication once a week', () => {
    const answered: CheckIn = {
      ...weeklyDone,
      countermeasures: [
        {
          questionId: 'boneMedication',
          answer: 'Yes',
          recordedAt: new Date(2026, 10, 12, 8).toISOString(),
        },
      ],
    }
    const c = ctx({ profile: profile(['boneMedication']), checkIns: [answered] })
    expect(keys(c, calmDay)).not.toContain('cm:boneMedication')
  })
})

describe('system and task check-ins', () => {
  it('asks every enterable indicator of one system, and no core questions', () => {
    expect(keys(ctx({ mode: { kind: 'system', systemId: 'eyes' } }))).toEqual([
      'nearVision',
      'blurredVision',
      'headache',
      'note',
    ])
    // Calculated and mission-control values are never asked
    expect(keys(ctx({ mode: { kind: 'system', systemId: 'radiation' } }))).toEqual([
      'cumulativeDose',
      'note',
    ])
  })

  it('asks the indicators named by a task id', () => {
    expect(taskIndicatorIds('recheck-bodyTemperature')).toEqual(['bodyTemperature'])
    expect(taskIndicatorIds('weekly-nearVision')).toEqual(['nearVision'])
    expect(taskIndicatorIds('event-landing')).toEqual([
      'motionSickness',
      'dizziness',
      'balanceTest',
    ])
    expect(taskIndicatorIds('nonsense')).toEqual([])
    expect(keys(ctx({ mode: { kind: 'task', taskId: 'recheck-bodyTemperature' } }))).toEqual([
      'bodyTemperature',
      'note',
    ])
  })
})

describe('buildCheckIn', () => {
  it('saves answers as readings, skips as "not recorded", tapped symptoms as yes', () => {
    const c = ctx({ checkIns: [weeklyDone] })
    const answers: Answers = {
      ...calmDay,
      sleepHours: null, // skipped
      symptoms: true,
      symptomList: ['palpitations', 'headache'],
      headache: 1,
      'cm:thighCuffs': 'Yes, under 3 h',
      note: '  Felt a bit off after the EVA prep  ',
    }
    const questions = buildQuestions(c, answers)
    const checkIn = buildCheckIn(c, questions, answers, 'c1', NOW.toISOString())

    const value = (id: string) => checkIn.readings.find((r) => r.indicatorId === id)?.value
    expect(value('restingHeartRate')).toBe(60)
    expect(value('sleepHours')).toBeNull()
    expect(value('headache')).toBe(1)
    expect(value('palpitations')).toBe(true)
    expect(checkIn.countermeasures).toEqual([
      { questionId: 'thighCuffs', answer: 'Yes, under 3 h', recordedAt: NOW.toISOString() },
    ])
    expect(checkIn.note).toBe('Felt a bit off after the EVA prep')
    expect(checkIn).toMatchObject({
      id: 'c1',
      profileId: 'me',
      missionId: 'iss',
      mode: { kind: 'daily' },
    })
    expect(checkIn.completedAt).toBe(NOW.toISOString())
  })

  it('works on real demo history', () => {
    const demo = generateDemoData(DEMO_CREW[1], 'iss', NOW)
    const c = ctx({ profile: demo.profile, checkIns: demo.checkIns, events: demo.events })
    // Okafor lists bone medication and a B vitamin
    expect(keys(c, calmDay)).toContain('cm:dailySupplements')
  })
})
