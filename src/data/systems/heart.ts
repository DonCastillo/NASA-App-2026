import type { SystemDef } from '../../types'

// Heart & circulation — plan/body-systems.md §1, sources in plan/health-indicators.md (#1–4).
// Thresholds are illustrative demo values, not medical advice.
// Bands are half-open: min ≤ value < max. "130–139" is written as { min: 130, max: 140 }.
export const heart: SystemDef = {
  id: 'heart',
  name: 'Heart & circulation',
  region: 'chest / heart',
  whatItDoes: 'Pumps blood and keeps blood pressure steady when posture or gravity changes.',
  whyInSpace: [
    'In weightlessness, fluids shift toward the head.',
    'The heart and blood vessels adapt, and the heart can become more spherical.',
    'Risks include arrhythmias, blood clots (from altered venous flow in the neck) and low blood pressure that can cause fainting at landing.',
  ],
  indicators: [
    {
      id: 'bloodPressure',
      name: 'Blood pressure',
      question: "What's your blood pressure?",
      unit: 'mmHg',
      input: 'numberPair',
      tier: 'core',
      scoring: {
        kind: 'pairBands',
        // Systolic (top number). Low is red too: it can mean fainting at landing.
        first: [
          { status: 'red', max: 85 },
          { status: 'amber', min: 85, max: 90 },
          { status: 'green', min: 90, max: 130 },
          { status: 'amber', min: 130, max: 140 },
          { status: 'red', min: 140 },
        ],
        // Diastolic (bottom number)
        second: [
          { status: 'green', max: 85 },
          { status: 'amber', min: 85, max: 90 },
          { status: 'red', min: 90 },
        ],
      },
      plausible: { min: 30, max: 250 },
      howToMeasure: [
        'Sit still for 5 minutes, before any exercise.',
        'Wrap the cuff on your upper arm, at heart level.',
        'Enter both numbers: the top (systolic) and the bottom (diastolic).',
      ],
      commonMistake:
        'Measuring right after exercise or caffeine, or with the cuff below heart level.',
      sourceType: 'direct',
      sources: ['challenge-statement', 'risk-of-cardiovascular-adaptations', 'venous-haemostasis'],
    },
    {
      id: 'restingHeartRate',
      name: 'Resting heart rate',
      question: "What's your resting heart rate?",
      unit: 'bpm',
      input: 'number',
      tier: 'core',
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'red', max: 45 },
          { status: 'amber', min: 45, max: 50 },
          { status: 'green', min: 50, max: 91 },
          { status: 'amber', min: 91, max: 101 },
          { status: 'red', min: 101 },
        ],
      },
      plausible: { min: 25, max: 220 },
      howToMeasure: [
        'Measure on waking, before getting up.',
        'Use your wearable, or count your pulse at the wrist for a full 60 seconds.',
      ],
      commonMistake: 'Counting for only 15 seconds and multiplying: count the full minute.',
      sourceType: 'direct',
      sources: ['challenge-statement'],
    },
    {
      id: 'palpitations',
      name: 'Irregular heartbeat / palpitations',
      question: 'Did you notice an irregular or racing heartbeat?',
      input: 'yesNo',
      tier: 'followUp',
      // Once → amber; repeated (2+ days in a row) → red.
      // "With dizziness or chest pain → red" links two indicators; handled in src/lib/status.ts.
      scoring: { kind: 'yesNo', yes: 'amber', no: 'green' },
      streak: { when: 'amber', days: 2, becomes: 'red' },
      howToMeasure: [
        'Notice whether your heart felt fluttering, pounding, skipping or racing while at rest.',
        'Add a note on when it happened and how long it lasted.',
      ],
      sourceType: 'proxy',
      sources: ['risk-of-cardiovascular-adaptations', 'cipher'],
    },
    {
      id: 'neckArmSwelling',
      name: 'Neck or arm swelling / pain',
      question: 'Any new swelling or pain in your neck or arm?',
      input: 'yesNo',
      tier: 'followUp',
      // A possible blood-clot sign: any "yes" is red
      scoring: { kind: 'yesNo', yes: 'red', no: 'green' },
      howToMeasure: [
        'Check your neck and both arms for new swelling, tightness, warmth or pain.',
        'Compare left and right sides.',
      ],
      sourceType: 'proxy',
      sources: ['venous-haemostasis', 'risk-of-cardiovascular-adaptations'],
    },
  ],
  actions: {
    green: ['Keep exercising and eating the planned diet.'],
    amber: [
      'Recheck within 1 hour.',
      'Hydrate, and log any caffeine or exercise taken before the reading.',
    ],
    red: ['Stop strenuous work.', 'Run the onboard cardiac protocol and escalate.'],
  },
  extraAdvice: ['Before landing: fluid loading and lower-body compression garments.'],
  pin: { side: 'right', order: 2, label: 'Heart' },
  sources: ['risk-of-cardiovascular-adaptations', 'venous-haemostasis', 'thigh-cuff', 'cipher'],
}
