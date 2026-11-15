import { describe, expect, it } from 'vitest'
import { emptyForm, formFromProfile, formProblems, profileFromForm, withMission } from './setupForm'

const TODAY = new Date(2026, 10, 15, 9, 0)

describe('setup form', () => {
  it('starts blank on the ISS from today, with its default length', () => {
    const form = emptyForm(TODAY)
    expect(form).toMatchObject({
      name: '',
      missionId: 'iss',
      startDate: '2026-11-15',
      lengthDays: '180',
    })
  })

  it('pre-fills the default length when the mission changes', () => {
    expect(withMission(emptyForm(TODAY), 'mars').lengthDays).toBe('210')
    expect(withMission(emptyForm(TODAY), 'artemis').lengthDays).toBe('30')
  })

  it('only needs a name (plus a valid start date and length)', () => {
    const form = emptyForm(TODAY)
    expect(formProblems(form)).toEqual(['Add a display name or call sign.'])
    expect(formProblems({ ...form, name: 'Don' })).toEqual([])
    expect(formProblems({ ...form, name: 'Don', lengthDays: '12.5' })).toEqual([
      'Mission length must be a whole number of days.',
    ])
  })

  it('turns the form into a profile, leaving empty fields out', () => {
    const form = {
      ...withMission(emptyForm(TODAY), 'mars'),
      name: '  Don  ',
      age: '41',
      sex: 'male' as const,
      preflightBodyMassKg: '72,5',
      supplements: ['bVitamin'],
      baselines: { ...emptyForm(TODAY).baselines, restingHeartRate: '58' },
    }
    const profile = profileFromForm(form, 'p1')
    expect(profile).toEqual({
      id: 'p1',
      name: 'Don',
      isDemo: false,
      age: 41,
      sex: 'male',
      heightCm: undefined,
      preflightBodyMassKg: 72.5,
      supplements: ['bVitamin'],
      baselines: { restingHeartRate: 58 }, // the rest fall back to the first 7 days
      mission: { profileId: 'mars', startDate: '2026-11-15', lengthDays: 210 },
    })
  })

  it('round-trips an existing profile through the form', () => {
    const profile = profileFromForm({ ...emptyForm(TODAY), name: 'Sam', age: '35' }, 'p2')
    expect(profileFromForm(formFromProfile(profile), 'p2')).toEqual(profile)
  })
})
