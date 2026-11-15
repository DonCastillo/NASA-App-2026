import type { SystemDef } from '../../types'

// Bones & muscles — plan/body-systems.md §3, sources in plan/health-indicators.md (#8–11).
// Thresholds are illustrative demo values, not medical advice.
// Severity scale: 0 None · 1 Mild · 2 Moderate · 3 Severe. Bands are half-open (min ≤ value < max).
export const bones: SystemDef = {
  id: 'bones',
  name: 'Bones & muscles',
  region: 'skeleton / limbs / spine',
  whatItDoes: 'Supports the body, allows movement and carries loads, including a spacesuit.',
  whyInSpace: [
    'Weight-bearing bones (spine, hips) lose about 1–1.5% of their density per month without countermeasures.',
    'On average, crews lose 10–12% of their strength and aerobic fitness, and 12–38% of crew members lose more than 20%.',
    'The spine lengthens by up to 3%.',
    'The risk of falls and injury rises at gravity transitions.',
  ],
  indicators: [
    {
      id: 'exerciseMinutes',
      name: 'Exercise completed',
      question: 'How many minutes did you exercise yesterday?',
      unit: 'min',
      input: 'number',
      tier: 'core',
      // Under 90 min is amber; under 60 min for 3+ days in a row becomes red
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'amber', max: 90 },
          { status: 'green', min: 90 },
        ],
      },
      streak: { when: 'amber', days: 3, becomes: 'red', below: 60 },
      plausible: { min: 0, max: 600 },
      howToMeasure: [
        'Read the total minutes from the exercise device log.',
        'Count resistive and aerobic sessions together.',
      ],
      sourceType: 'direct',
      sources: ['risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness'],
    },
    {
      id: 'strengthTest',
      name: 'Fitness self-test (strength)',
      question: 'What was your result on the strength self-test?',
      unit: 'kg',
      input: 'number',
      tier: 'weekly',
      // The user enters the result; it is scored as % of their preflight result
      scoring: {
        kind: 'bands',
        basis: 'percentOfBaseline',
        bands: [
          { status: 'red', max: 80 },
          { status: 'amber', min: 80, max: 90 },
          { status: 'green', min: 90 },
        ],
      },
      plausible: { min: 0, max: 500 },
      howToMeasure: [
        'Do the standard strength set on the resistive exercise device, as in your preflight test.',
        'Enter the load you completed.',
      ],
      sourceType: 'direct',
      sources: ['risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness', 'zero-t2'],
    },
    {
      id: 'boneLossEstimate',
      name: 'Estimated bone loss',
      question: 'Estimated bone loss',
      unit: '%',
      input: 'calculated',
      tier: 'auto',
      // Calculated from mission day and exercise compliance (src/lib/derived.ts). 5% and above is red.
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'green', max: 3 },
          { status: 'amber', min: 3, max: 5 },
          { status: 'red', min: 5 },
        ],
      },
      plausible: { min: 0, max: 30 },
      howToMeasure: [
        'Nothing to measure: the app estimates it from your mission day and exercise log.',
        'Weight-bearing bones lose about 1–1.5% per month without countermeasures; exercise slows this.',
      ],
      sourceType: 'proxy',
      sources: ['risk-of-spaceflight-induced-bone-changes', 'astronauts-spines-under-scrutiny'],
    },
    {
      id: 'backPain',
      name: 'Back pain',
      question: 'How bad is your back pain?',
      input: 'severity',
      tier: 'followUp',
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'green', max: 1 },
          { status: 'amber', min: 1, max: 3 },
          { status: 'red', min: 3 },
        ],
      },
      plausible: { min: 0, max: 3 },
      howToMeasure: [
        'Rate your back pain as it feels now: none, mild, moderate or severe.',
        'Add a note if it started after exercise, a spacewalk or a gravity transition.',
      ],
      sourceType: 'proxy',
      sources: ['risk-of-spaceflight-induced-bone-changes', 'astronauts-spines-under-scrutiny'],
    },
  ],
  actions: {
    green: ['Keep exercising about 1.5 h a day, 6–7 days a week.'],
    amber: ['Add resistive sessions.', 'Check your exercise equipment and form.'],
    red: [
      'Have the CMO review your exercise plan, and escalate.',
      'Take extra care before spacewalks or landing.',
    ],
  },
  pin: { side: 'left', order: 4, label: 'Bones & muscles' },
  sources: [
    'risk-of-spaceflight-induced-bone-changes',
    'risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness',
    'astronauts-spines-under-scrutiny',
    'zero-t2',
    'risk-of-injury-from-dynamic-loads',
  ],
}
