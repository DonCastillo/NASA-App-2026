import type { CountermeasureQuestion } from '../types'

// The 10 countermeasure and medication questions (plan/body-systems.md → Countermeasure and
// medication questions). One tap each, asked only when relevant. They never change green/amber/red;
// they appear next to readings in charts and in reports. When to ask is decided in src/lib/triggers.ts.
export const COUNTERMEASURES: CountermeasureQuestion[] = [
  // ── Triggered by a reading ───────────────────────────────────────────────
  {
    id: 'thighCuffs',
    question: 'Did you wear thigh cuffs today?',
    answers: ['No', 'Yes, under 3 h', 'Yes, 3 h or more'],
    group: 'triggered',
    askedWhen: 'After a headache or blurred-vision follow-up',
    frequency: 'Occasionally (symptom days)',
    sources: ['thigh-cuff'],
  },
  {
    id: 'motionSicknessMedicine',
    question: 'Did you take motion sickness medicine?',
    answers: ['No', 'Yes, before symptoms', 'Yes, after symptoms'],
    group: 'triggered',
    askedWhen: 'After motion sickness or dizziness is answered',
    frequency: 'Rare (early mission, after landings)',
    sources: ['risk-of-altered-sensorimotor-and-vestibular-function'],
  },
  {
    id: 'caffeine',
    question: 'Did you have caffeine in the last 6 hours?',
    answers: ['No', '1 drink', '2+ drinks'],
    group: 'triggered',
    askedWhen: 'After an amber/red blood pressure or heart rate reading, or poor sleep',
    frequency: 'Occasionally (a few times a month)',
    sources: ['risk-from-inadequate-sleep-and-irregular-schedules'],
  },
  {
    id: 'exerciseBeforeReading',
    question: 'Did you exercise in the hour before this reading?',
    answers: ['No', 'Yes'],
    group: 'triggered',
    askedWhen: 'After an amber/red blood pressure or heart rate reading',
    frequency: 'Rare',
    sources: [], // general measurement practice
  },
  {
    id: 'painOrFeverMedicine',
    question: 'Did you take anything for pain or fever?',
    answers: ['No', 'Yes: pain reliever', 'Yes: fever reducer', 'Yes: other'],
    group: 'triggered',
    askedWhen: 'After a headache, back pain or a temperature of 37.3 °C or more',
    frequency: 'Occasionally',
    sources: [], // general practice: medicine can mask a fever
  },

  // ── Routine ──────────────────────────────────────────────────────────────
  {
    id: 'dailySupplements',
    question: 'Did you take your daily supplements?',
    answers: ['Yes', 'Missed today'],
    group: 'routine',
    askedWhen: 'In the daily check-in, only if the profile lists a daily supplement',
    frequency: 'Daily',
    onlyIfProfileHas: ['bVitamin', 'otherDailySupplement'],
    sources: ['b-complex'],
  },
  {
    id: 'boneMedication',
    question: 'Did you take your bone medication this week?',
    answers: ['Yes', 'Missed'],
    group: 'routine',
    askedWhen: 'Weekly, only if the profile lists bone medication',
    frequency: 'Weekly',
    onlyIfProfileHas: ['boneMedication'],
    sources: ['risk-of-spaceflight-induced-bone-changes'],
  },
  {
    id: 'brightLight',
    question: 'Did you get your scheduled bright-light exposure?',
    answers: ['Yes', 'Partly', 'No'],
    group: 'routine',
    askedWhen: "After a poor night's sleep",
    frequency: 'Occasionally',
    sources: ['risk-from-inadequate-sleep-and-irregular-schedules'],
  },

  // ── Before landing (event-driven) ────────────────────────────────────────
  {
    id: 'fluidLoading',
    question: 'Have you completed fluid loading?',
    answers: ['Yes', 'Not yet'],
    group: 'preLanding',
    askedWhen: 'Before a landing event',
    frequency: 'Once per landing',
    sources: ['risk-of-cardiovascular-adaptations'],
  },
  {
    id: 'compressionGarments',
    question: 'Are you wearing compression garments?',
    answers: ['Yes', 'Not yet'],
    group: 'preLanding',
    askedWhen: 'Before a landing event',
    frequency: 'Once per landing',
    sources: ['risk-of-cardiovascular-adaptations'],
  },
]
