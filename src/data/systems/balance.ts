import type { SystemDef } from '../../types'

// Balance & orientation — plan/body-systems.md §7, sources in plan/health-indicators.md (#23–25).
// Thresholds are illustrative demo values, not medical advice.
// Severity scale: 0 None · 1 Mild · 2 Moderate · 3 Severe. Bands are half-open (min ≤ value < max).
export const balance: SystemDef = {
  id: 'balance',
  name: 'Balance & orientation',
  region: 'inner ear',
  whatItDoes: 'Senses motion and orientation, and coordinates eyes, head and body.',
  whyInSpace: [
    'Gravity changes cause space motion sickness (most astronauts get it, and susceptibility on Earth doesn’t predict it) and spatial disorientation.',
    'These can impair piloting, landing and spacewalks.',
  ],
  indicators: [
    {
      id: 'motionSickness',
      name: 'Motion sickness',
      question: 'Do you feel motion sick?',
      input: 'severity',
      tier: 'followUp',
      scaleLabels: ['None', 'Mild', 'Moderate', 'Vomiting'],
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
        'Notice nausea, sweating, headache or feeling sick when you move your head.',
        'Rate how you feel now. It is also asked after landings and other gravity changes.',
      ],
      sourceType: 'direct',
      sources: [
        'risk-of-altered-sensorimotor-and-vestibular-function',
        'artemis-ii-standard-measures',
      ],
    },
    {
      id: 'dizziness',
      name: 'Dizziness / disorientation',
      question: 'Do you feel dizzy or disoriented?',
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
        'Notice spinning, tilting or being unsure which way is up.',
        'Rate how you feel now, especially after a gravity transition.',
      ],
      sourceType: 'direct',
      sources: [
        'risk-of-altered-sensorimotor-and-vestibular-function',
        'simulating-manual-piloting-for-moon-landings',
      ],
    },
    {
      id: 'balanceTest',
      name: 'Balance self-test',
      question: 'How long could you stand on one leg with your eyes closed?',
      unit: 's',
      input: 'number',
      // Only on a surface (Moon or Mars): after landing, then weekly
      tier: 'auto',
      // Scored as % change from the preflight balance time
      scoring: {
        kind: 'bands',
        basis: 'percentChangeFromBaseline',
        bands: [
          { status: 'red', max: -40 },
          { status: 'amber', min: -40, max: -20 },
          { status: 'green', min: -20 },
        ],
      },
      plausible: { min: 0, max: 120 },
      howToMeasure: [
        'Stand near a wall or handhold, with a crewmate close by after landing.',
        'Lift one foot, close your eyes and start the timer. Stop when you put the foot down or open your eyes.',
      ],
      sourceType: 'direct',
      sources: [
        'simulating-manual-piloting-for-moon-landings',
        'artemis-ii-standard-measures',
        'zero-t2',
      ],
    },
  ],
  actions: {
    green: ['Keep your normal routine.'],
    amber: [
      'Limit head movements.',
      'Use anti-motion-sickness medication per protocol.',
      'Avoid critical tasks until it improves.',
    ],
    red: ['No piloting, spacewalks or driving.', 'Follow the protocol and escalate.'],
  },
  pin: { side: 'right', order: 1, label: 'Balance' },
  sources: [
    'risk-of-altered-sensorimotor-and-vestibular-function',
    'simulating-manual-piloting-for-moon-landings',
    'artemis-ii-standard-measures',
  ],
}
