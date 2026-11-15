import type { IndicatorId } from '../types'

// The one-screen symptom tap list, shown when "Any symptoms today?" is answered yes
// (plan/body-systems.md → Triggers for follow-ups). Each tapped item asks only its own question(s);
// yes/no symptoms (palpitations, swelling) are recorded as "yes" without another question.
export type SymptomOption = {
  id: string
  label: string
  /** Follow-up questions this symptom opens */
  asks: IndicatorId[]
  /** Yes/no indicators recorded as "yes" when tapped */
  recordsYes?: IndicatorId[]
}

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  { id: 'headache', label: 'Headache', asks: ['headache'] },
  { id: 'blurredVision', label: 'Blurred or distorted vision', asks: ['blurredVision'] },
  {
    id: 'palpitations',
    label: 'Irregular or racing heartbeat',
    asks: [],
    recordsYes: ['palpitations'],
  },
  {
    id: 'neckArmSwelling',
    label: 'Neck or arm swelling / pain',
    asks: [],
    recordsYes: ['neckArmSwelling'],
  },
  { id: 'backPain', label: 'Back pain', asks: ['backPain'] },
  { id: 'immune', label: 'Cold sore, rash, sore throat or cough', asks: ['immuneSymptoms'] },
  { id: 'appetite', label: 'Poor appetite', asks: ['appetite', 'mealsCompleted'] },
  { id: 'motionSickness', label: 'Motion sickness', asks: ['motionSickness'] },
  { id: 'dizziness', label: 'Dizziness', asks: ['dizziness'] },
]
