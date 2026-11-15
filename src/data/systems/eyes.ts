import type { SystemDef } from '../../types'

// Eyes & brain (SANS) — plan/body-systems.md §2, sources in plan/health-indicators.md (#5–7).
// Thresholds are illustrative demo values, not medical advice.
// Severity scale: 0 None · 1 Mild · 2 Moderate · 3 Severe. Bands are half-open (min ≤ value < max).
export const eyes: SystemDef = {
  id: 'eyes',
  name: 'Eyes & brain (SANS)',
  region: 'head / eyes',
  whatItDoes: 'Vision, and the pressure balance of fluid around the brain and optic nerve.',
  whyInSpace: [
    'Fluid shifting toward the head can cause spaceflight associated neuro-ocular syndrome (SANS).',
    'Its signs are optic nerve swelling, retinal folds and a flattened back of the eye.',
    'About 70% of ISS astronauts show some swelling at the back of the eye, and the risk grows with mission length.',
  ],
  indicators: [
    {
      id: 'nearVision',
      name: 'Near-vision self-check',
      question: 'How many lines can you read on the near-vision card?',
      unit: 'lines',
      input: 'number',
      tier: 'weekly',
      // Compared with the preflight baseline: 0 = same, −1 = one line worse.
      // "Sudden change" is a trend rule (src/lib/trends.ts).
      scoring: {
        kind: 'bands',
        basis: 'changeFromBaseline',
        bands: [
          { status: 'red', max: -1 }, // 2 or more lines worse
          { status: 'amber', min: -1, max: 0 }, // 1 line worse
          { status: 'green', min: 0 }, // same or better
        ],
      },
      plausible: { min: 0, max: 20 },
      howToMeasure: [
        'Hold the near-vision card at the marked distance, in good light.',
        'Cover one eye and read down to the smallest line you can read clearly. Repeat with the other eye.',
        'Enter the number of the smallest line your weaker eye can read.',
      ],
      sourceType: 'proxy',
      sources: ['risk-of-spaceflight-associated-neuro-ocular-syndrome-sans', 'cipher'],
    },
    {
      id: 'blurredVision',
      name: 'Blurred or distorted vision',
      question: 'Is your vision blurred or distorted?',
      input: 'severity',
      tier: 'followUp',
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'green', max: 1 },
          { status: 'amber', min: 1, max: 2 },
          { status: 'red', min: 2 },
        ],
      },
      plausible: { min: 0, max: 3 },
      howToMeasure: [
        'Look at text and straight lines at reading distance and across the cabin.',
        'Notice blur, wavy or bent lines, or a change from how things usually look.',
      ],
      sourceType: 'direct',
      sources: ['thigh-cuff', 'cipher'],
    },
    {
      id: 'headache',
      name: 'Headache',
      question: 'How bad is your headache?',
      input: 'severity',
      tier: 'followUp',
      // "Any headache with vision change → red" links two indicators; handled in src/lib/status.ts.
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'green', max: 1 },
          { status: 'amber', min: 1, max: 2 },
          { status: 'red', min: 2 },
        ],
      },
      plausible: { min: 0, max: 3 },
      howToMeasure: [
        'Rate the headache as it feels now: none, mild, moderate or severe.',
        'Add a note if it is new, worse when lying back, or comes with vision changes.',
      ],
      sourceType: 'proxy',
      sources: ['risk-of-hypoxia', 'risk-of-spaceflight-associated-neuro-ocular-syndrome-sans'],
    },
  ],
  actions: {
    green: ['Keep your routine weekly vision check.'],
    amber: [
      'Recheck tomorrow.',
      'Log any fluid-shift countermeasures you use, such as thigh cuffs if available.',
    ],
    red: ['Request an eye exam (onboard ultrasound or imaging) and escalate.'],
  },
  pin: { side: 'left', order: 2, label: 'Eyes & brain' },
  sources: [
    'risk-of-spaceflight-associated-neuro-ocular-syndrome-sans',
    'brain-fluid-pressure',
    'spinal-fluid-biomarkers',
    'b-complex',
    'thigh-cuff',
  ],
}
