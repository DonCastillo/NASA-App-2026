import type { SystemDef } from '../../types'

// Metabolism & nutrition — plan/body-systems.md §5, sources in plan/health-indicators.md (#14–17).
// Thresholds are illustrative demo values, not medical advice.
// Rating scale: 1 Bad · 2 Low · 3 OK · 4 Good · 5 Great. Bands are half-open (min ≤ value < max).
export const metabolism: SystemDef = {
  id: 'metabolism',
  name: 'Metabolism & nutrition',
  region: 'abdomen / gut',
  whatItDoes: 'Turns food into energy and nutrients, and keeps blood sugar and body mass stable.',
  whyInSpace: [
    'Months of the same foods cause menu fatigue, which lowers appetite and can lead to body mass loss and nutritional deficiencies.',
    'There is no resupply on long missions.',
    'An enhanced diet (fruits, vegetables, fish) is being studied for immune and gut health.',
  ],
  indicators: [
    {
      id: 'bloodGlucose',
      name: 'Blood glucose (fasting)',
      question: "What's your fasting blood glucose?",
      unit: 'mg/dL',
      input: 'number',
      tier: 'weekly',
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'red', max: 55 },
          { status: 'amber', min: 55, max: 70 },
          { status: 'green', min: 70, max: 100 },
          { status: 'amber', min: 100, max: 126 },
          { status: 'red', min: 126 },
        ],
      },
      plausible: { min: 20, max: 600 },
      howToMeasure: [
        'Measure before breakfast, with nothing to eat or drink except water since waking.',
        'Wash and dry your hands, prick the side of a fingertip and touch the strip to the drop.',
      ],
      commonMistake: 'Measuring after eating or drinking: it must be fasting.',
      sourceType: 'direct',
      sources: ['challenge-statement'],
    },
    {
      id: 'bodyMass',
      name: 'Body mass',
      question: "What's your body mass today?",
      unit: 'kg',
      input: 'number',
      tier: 'weekly',
      // Scored as % change from the profile's preflight body mass.
      // The plan only says "within ±2% is green"; a gain of 2% or more is treated as amber.
      scoring: {
        kind: 'bands',
        basis: 'percentChangeFromBaseline',
        bands: [
          { status: 'red', max: -5 },
          { status: 'amber', min: -5, max: -2 },
          { status: 'green', min: -2, max: 2 },
          { status: 'amber', min: 2 },
        ],
      },
      plausible: { min: 30, max: 200 },
      step: 0.1,
      howToMeasure: [
        'Use the body mass measurement device, at the same time of day each week.',
        'Measure before eating, in similar clothing each time.',
      ],
      commonMistake: 'Measuring at a different time of day, or after a meal.',
      sourceType: 'direct',
      sources: ['how-does-spaceflight-change-food-appeal'],
    },
    {
      id: 'appetite',
      name: 'Appetite / food enjoyment',
      question: 'How is your appetite and enjoyment of food?',
      input: 'rating',
      tier: 'followUp',
      // 3 or below is amber; 1–2 for 3+ days in a row becomes red
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'amber', max: 4 },
          { status: 'green', min: 4 },
        ],
      },
      streak: { when: 'amber', days: 3, becomes: 'red', below: 3 },
      plausible: { min: 1, max: 5 },
      howToMeasure: [
        'Think about the last day: did you look forward to meals and enjoy them?',
        'Pick the face that fits best.',
      ],
      sourceType: 'direct',
      sources: ['how-does-spaceflight-change-food-appeal'],
    },
    {
      id: 'mealsCompleted',
      name: 'Meals completed',
      question: 'How much of your planned food did you eat yesterday?',
      unit: '%',
      input: 'number',
      tier: 'followUp',
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'red', max: 75 },
          { status: 'amber', min: 75, max: 90 },
          { status: 'green', min: 90 },
        ],
      },
      plausible: { min: 0, max: 100 },
      step: 5,
      howToMeasure: [
        'Compare what you ate with your planned menu for the day.',
        'Estimate the share you finished, e.g. 100% = everything, 75% = three quarters.',
      ],
      sourceType: 'proxy',
      sources: ['how-does-spaceflight-change-food-appeal', 'risk-of-inadequate-food-and-nutrition'],
    },
  ],
  actions: {
    green: ['Keep eating a varied menu.'],
    amber: [
      'Swap in preferred foods or "bonus" items.',
      'If your glucose is low, take fast sugar and recheck in 15 minutes.',
    ],
    red: ['Ask the CMO to review your intake, and escalate.'],
  },
  pin: { side: 'right', order: 3, label: 'Metabolism' },
  sources: [
    'risk-of-inadequate-food-and-nutrition',
    'how-does-spaceflight-change-food-appeal',
    'enhanced-diet-may-help-astronauts-adapt-to-spaceflight',
  ],
}
