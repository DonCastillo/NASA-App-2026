import { format } from 'date-fns'
import { MISSIONS } from '../data/missions'
import type { Baselines, MissionProfileId, Profile, Sex } from '../types'

// The Setup form's state and conversion to a Profile (plan/tasks.md 5.7). Pure.
// Number fields are kept as text while typing; empty = not given ("Don't know" for baselines).

export type SetupForm = {
  name: string
  age: string
  sex: Sex | ''
  heightCm: string
  preflightBodyMassKg: string
  supplements: string[]
  baselines: Record<keyof Baselines, string>
  missionId: MissionProfileId
  startDate: string
  lengthDays: string
}

/** The 7 baseline fields, in the order of the form */
export const BASELINE_FIELDS: { key: keyof Baselines; label: string; unit: string }[] = [
  { key: 'restingSystolic', label: 'Resting blood pressure, top (systolic)', unit: 'mmHg' },
  { key: 'restingDiastolic', label: 'Resting blood pressure, bottom (diastolic)', unit: 'mmHg' },
  { key: 'restingHeartRate', label: 'Resting heart rate', unit: 'bpm' },
  { key: 'strengthScore', label: 'Strength self-test result', unit: 'kg' },
  { key: 'nearVisionLines', label: 'Near-vision card: smallest line read', unit: 'lines' },
  { key: 'balanceSeconds', label: 'Standing on one leg, eyes closed', unit: 's' },
  { key: 'typicalSleepHours', label: 'Typical sleep', unit: 'h' },
]

const text = (n: number | undefined) => (n === undefined ? '' : String(n))
const number = (s: string) => {
  const n = Number(s.replace(',', '.'))
  return s.trim() === '' || Number.isNaN(n) ? undefined : n
}

/** A blank form for a new profile (mission defaults to ISS, starting today) */
export function emptyForm(today: Date, missionId: MissionProfileId = 'iss'): SetupForm {
  return {
    name: '',
    age: '',
    sex: '',
    heightCm: '',
    preflightBodyMassKg: '',
    supplements: [],
    baselines: Object.fromEntries(
      BASELINE_FIELDS.map((f) => [f.key, '']),
    ) as SetupForm['baselines'],
    missionId,
    startDate: format(today, 'yyyy-MM-dd'),
    lengthDays: String(MISSIONS[missionId].defaultLengthDays),
  }
}

/** The form for editing an existing profile */
export function formFromProfile(profile: Profile): SetupForm {
  return {
    name: profile.name,
    age: text(profile.age),
    sex: profile.sex ?? '',
    heightCm: text(profile.heightCm),
    preflightBodyMassKg: text(profile.preflightBodyMassKg),
    supplements: [...profile.supplements],
    baselines: Object.fromEntries(
      BASELINE_FIELDS.map((f) => [f.key, text(profile.baselines[f.key])]),
    ) as SetupForm['baselines'],
    missionId: profile.mission.profileId,
    startDate: profile.mission.startDate,
    lengthDays: String(profile.mission.lengthDays),
  }
}

/** Choosing a mission pre-fills its default length (still editable) */
export const withMission = (form: SetupForm, missionId: MissionProfileId): SetupForm => ({
  ...form,
  missionId,
  lengthDays: String(MISSIONS[missionId].defaultLengthDays),
})

/** Problems that stop saving; empty when the form can be saved */
export function formProblems(form: SetupForm): string[] {
  const problems: string[] = []
  if (!form.name.trim()) problems.push('Add a display name or call sign.')
  const length = number(form.lengthDays)
  if (length === undefined || length < 1 || !Number.isInteger(length)) {
    problems.push('Mission length must be a whole number of days.')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) problems.push('Choose a mission start date.')
  return problems
}

/** The profile to save. Empty fields are left out (baselines then fall back to the first 7 days). */
export function profileFromForm(form: SetupForm, id: string): Profile {
  const baselines: Baselines = {}
  for (const field of BASELINE_FIELDS) {
    const value = number(form.baselines[field.key])
    if (value !== undefined) baselines[field.key] = value
  }
  return {
    id,
    name: form.name.trim(),
    isDemo: false,
    age: number(form.age),
    sex: form.sex || undefined,
    heightCm: number(form.heightCm),
    preflightBodyMassKg: number(form.preflightBodyMassKg),
    supplements: form.supplements,
    baselines,
    mission: {
      profileId: form.missionId,
      startDate: form.startDate,
      lengthDays: number(form.lengthDays) ?? MISSIONS[form.missionId].defaultLengthDays,
    },
  }
}
