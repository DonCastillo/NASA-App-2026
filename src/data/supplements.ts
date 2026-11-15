import type { SupplementOption } from '../types'

// "Regular supplements / medications" pick list for the crew profile (plan/body-systems.md →
// User profile & context). Only items the profile lists get the routine countermeasure questions.
// Content only. Not medical advice.
export const SUPPLEMENTS: SupplementOption[] = [
  {
    id: 'bVitamin',
    label: 'Daily B vitamin',
    kind: 'supplement',
    schedule: 'daily',
    sources: ['b-complex'],
  },
  {
    id: 'otherDailySupplement',
    label: 'Other daily supplement',
    kind: 'supplement',
    schedule: 'daily',
    sources: [],
  },
  {
    id: 'boneMedication',
    label: 'Bone medication (weekly)',
    kind: 'medication',
    schedule: 'weekly',
    sources: ['risk-of-spaceflight-induced-bone-changes'],
  },
]
