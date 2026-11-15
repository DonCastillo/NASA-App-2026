import type { SystemDef } from '../../types'

// Immune system — plan/body-systems.md §4, sources in plan/health-indicators.md (#12–13).
// Thresholds are illustrative demo values, not medical advice.
// Bands are half-open (min ≤ value < max).
export const immune: SystemDef = {
  id: 'immune',
  name: 'Immune system',
  region: 'torso / lymph nodes',
  whatItDoes: 'Defends against infection and keeps dormant viruses in check.',
  whyInSpace: [
    'Radiation, microgravity, stress and poor sleep weaken immune responses.',
    'Dormant viruses can reactivate, causing cold sores or shingles.',
    'Crew members have reported rashes, atypical allergies and infections.',
    'Microbes on the body and in the closed habitat change, and some become more virulent.',
  ],
  indicators: [
    {
      id: 'bodyTemperature',
      name: 'Body temperature',
      question: "What's your body temperature?",
      unit: '°C',
      input: 'number',
      tier: 'core',
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'red', max: 35.5 },
          // The plan leaves 35.5–36.0 unspecified; treated as amber (on the low side)
          { status: 'amber', min: 35.5, max: 36.1 },
          { status: 'green', min: 36.1, max: 37.3 },
          { status: 'amber', min: 37.3, max: 38 },
          { status: 'red', min: 38 },
        ],
      },
      plausible: { min: 33, max: 43 },
      step: 0.1,
      howToMeasure: [
        'Measure at rest, before exercise or a hot drink.',
        'Use the oral or forehead thermometer and wait for the beep.',
      ],
      commonMistake: 'Measuring right after a hot drink or exercise.',
      sourceType: 'direct',
      sources: ['challenge-statement'],
    },
    {
      id: 'immuneSymptoms',
      name: 'Immune symptoms',
      question: 'Do you have any of these symptoms?',
      input: 'checklist',
      tier: 'followUp',
      options: [
        { id: 'coldSore', label: 'Cold sore' },
        { id: 'rash', label: 'Rash' },
        { id: 'spreadingRash', label: 'Rash that is spreading' },
        { id: 'soreThroat', label: 'Sore throat' },
        { id: 'cough', label: 'Cough' },
        { id: 'woundNotHealing', label: 'Wound not healing' },
        { id: 'allergy', label: 'New allergy or itching' },
      ],
      // None → green · 1 symptom → amber · 2+ symptoms or a spreading rash → red.
      // "Fever with symptoms → red" links two indicators; handled in src/lib/status.ts.
      scoring: {
        kind: 'checklist',
        countBands: [
          { status: 'green', max: 1 },
          { status: 'amber', min: 1, max: 2 },
          { status: 'red', min: 2 },
        ],
        redIfAny: ['spreadingRash'],
      },
      howToMeasure: [
        'Check your lips, skin and any cuts or scrapes.',
        'Tick every symptom you have today, even if mild.',
      ],
      sourceType: 'direct',
      sources: [
        'risk-of-altered-immune-system-responses',
        'immune-biomarkers',
        'scientists-probe-how-long-term-spaceflight-alters-immunity',
      ],
    },
  ],
  actions: {
    green: ['Follow your hygiene routines and sleep well.'],
    amber: [
      'Recheck your temperature in 4–6 hours.',
      'Follow hygiene and isolation basics, and tell the CMO.',
    ],
    red: ['Run the onboard infection protocol.', 'Consider isolating from the crew, and escalate.'],
  },
  pin: { side: 'left', order: 3, label: 'Immune' },
  sources: [
    'risk-of-altered-immune-system-responses',
    'risk-of-host-microorganism-interactions',
    'immune-biomarkers',
    'scientists-probe-how-long-term-spaceflight-alters-immunity',
  ],
}
