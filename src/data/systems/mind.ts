import type { SystemDef } from '../../types'

// Mind & sleep — plan/body-systems.md §6, sources in plan/health-indicators.md (#18–22).
// Thresholds are illustrative demo values, not medical advice.
// Rating scale: 1 Bad · 2 Low · 3 OK · 4 Good · 5 Great (stress is reversed). Bands are half-open.
export const mind: SystemDef = {
  id: 'mind',
  name: 'Mind & sleep',
  region: 'brain (mind)',
  whatItDoes: 'Mood, focus, decision-making and teamwork, restored by sleep.',
  whyInSpace: [
    'Isolation and confinement raise the risk of anxiety and depression.',
    'Irregular light cycles (16 sunrises a day on the ISS) and workload disrupt sleep.',
    'Comms delays limit support from family and professionals.',
    'Small spaces strain teamwork.',
  ],
  indicators: [
    {
      id: 'sleepHours',
      name: 'Sleep duration',
      question: 'How many hours did you sleep?',
      unit: 'h',
      input: 'number',
      tier: 'core',
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'red', max: 6 },
          { status: 'amber', min: 6, max: 7 },
          { status: 'green', min: 7 },
        ],
      },
      plausible: { min: 0, max: 16 },
      howToMeasure: [
        'Read last night’s sleep from your wearable, or estimate from when you fell asleep and woke up.',
        'Count only time asleep, not time resting in your sleep station.',
      ],
      sourceType: 'direct',
      sources: ['challenge-statement', 'archer', 'standard-measures'],
    },
    {
      id: 'sleepQuality',
      name: 'Sleep quality',
      question: 'How well did you sleep?',
      input: 'rating',
      tier: 'followUp',
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'red', max: 3 },
          { status: 'amber', min: 3, max: 4 },
          { status: 'green', min: 4 },
        ],
      },
      plausible: { min: 1, max: 5 },
      howToMeasure: [
        'Think about how rested you feel and how often you woke up.',
        'Pick the face that fits best.',
      ],
      sourceType: 'proxy',
      sources: ['risk-from-inadequate-sleep-and-irregular-schedules', 'standard-measures'],
    },
    {
      id: 'mood',
      name: 'Mood',
      question: 'How is your mood today?',
      input: 'rating',
      tier: 'core',
      // 1–2 red, 3 amber; OK-or-lower (amber) for 3+ days in a row becomes red
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'red', max: 3 },
          { status: 'amber', min: 3, max: 4 },
          { status: 'green', min: 4 },
        ],
      },
      streak: { when: 'amber', days: 3, becomes: 'red' },
      plausible: { min: 1, max: 5 },
      howToMeasure: ['Pick the face that matches how you feel right now.'],
      sourceType: 'direct',
      sources: ['challenge-statement', 'can-space-gardening-help-astronauts-cope-with-isolation'],
    },
    {
      id: 'stress',
      name: 'Stress',
      question: 'How stressed do you feel?',
      input: 'rating',
      tier: 'followUp',
      // Reversed scale: higher is worse
      scaleLabels: ['Calm', 'Relaxed', 'Some stress', 'Stressed', 'Overwhelmed'],
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'green', max: 3 },
          { status: 'amber', min: 3, max: 4 },
          { status: 'red', min: 4 },
        ],
      },
      plausible: { min: 1, max: 5 },
      howToMeasure: ['Think about your workload and how tense you have felt today.'],
      sourceType: 'proxy',
      sources: [
        'risk-of-behavioral-changes-and-psychiatric-disorders',
        'scientists-probe-how-long-term-spaceflight-alters-immunity',
      ],
    },
    {
      id: 'crewRelations',
      name: 'Crew relations',
      question: 'How are things going with your crew?',
      input: 'rating',
      tier: 'weekly',
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'red', max: 3 },
          { status: 'amber', min: 3, max: 4 },
          { status: 'green', min: 4 },
        ],
      },
      plausible: { min: 1, max: 5 },
      howToMeasure: [
        'Think about the past week: teamwork, communication and any tension.',
        'This answer is private to you unless you choose to share it.',
      ],
      sourceType: 'direct',
      sources: [
        'can-space-gardening-help-astronauts-cope-with-isolation',
        'risk-of-inadequate-teamwork',
      ],
    },
  ],
  actions: {
    green: ['Keep your scheduled relaxation and self-care.'],
    amber: [
      'Protect your sleep window and use the lighting cues.',
      'Limit caffeine late in the day.',
      'Journal, tend the plants, and talk with your crew.',
    ],
    red: [
      'Get support from the CMO and book a private conference with a psychologist (delayed messages on Mars).',
      'Adjust your schedule.',
    ],
  },
  pin: { side: 'left', order: 1, label: 'Mind & sleep' },
  sources: [
    'risk-of-behavioral-changes-and-psychiatric-disorders',
    'risk-from-inadequate-sleep-and-irregular-schedules',
    'risk-of-inadequate-teamwork',
    'can-space-gardening-help-astronauts-cope-with-isolation',
    'archer',
  ],
}
