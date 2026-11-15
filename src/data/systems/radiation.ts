import type { SystemDef } from '../../types'

// Radiation exposure — plan/body-systems.md §8, sources in plan/health-indicators.md (#26–28).
// Mission budgets and multipliers are illustrative demo values (budgets live in src/data/missions.ts).
// Bands are half-open (min ≤ value < max).
export const radiation: SystemDef = {
  id: 'radiation',
  name: 'Radiation exposure',
  region: 'whole body',
  whatItDoes: 'Not an organ: tracks your cumulative radiation dose, which affects all tissues.',
  whyInSpace: [
    'Radiation raises cancer risk and can damage the heart, blood vessels, eyes (cataracts) and bone marrow, and affect cognition.',
    'Neutrons are about 30% of the ISS radiation dose. ISS crews receive about 150 µSv/day of neutron radiation, hundreds of times the dose on Earth, and less in sleeping quarters.',
    'Spacewalk skin doses can be 6–25× those of nuclear workers.',
    'Moon and Mars missions leave Earth’s protective magnetosphere.',
  ],
  indicators: [
    {
      id: 'cumulativeDose',
      name: 'Cumulative mission dose',
      question: 'What does your dosimeter read?',
      unit: 'mSv',
      input: 'number',
      tier: 'weekly',
      // Scored as % of the mission's built-in dose budget. 80% and above is red.
      scoring: {
        kind: 'bands',
        basis: 'percentOfBudget',
        bands: [
          { status: 'green', max: 50 },
          { status: 'amber', min: 50, max: 80 },
          { status: 'red', min: 80 },
        ],
      },
      plausible: { min: 0, max: 2000 },
      step: 0.1,
      howToMeasure: [
        'Read the total dose on your personal dosimeter, in mSv.',
        'Read it weekly and after every spacewalk.',
      ],
      commonMistake: 'Forgetting to read the dosimeter after a spacewalk.',
      sourceType: 'direct',
      sources: [
        'little-transistor-records-radiation-levels',
        'mosfet-radiation-monitoring-system-and-matroshka-r',
        'radi-n2-tracking-space-radiation-and-its-risks',
      ],
    },
    {
      id: 'doseRate',
      name: 'Daily dose rate',
      question: 'Daily dose rate',
      unit: 'µSv/day',
      input: 'calculated',
      tier: 'auto',
      // Worked out from dosimeter readouts, compared with the mission's normal daily rate
      scoring: {
        kind: 'bands',
        basis: 'multipleOfBaseline',
        bands: [
          { status: 'green', max: 1.5 },
          { status: 'amber', min: 1.5, max: 3 },
          { status: 'red', min: 3 },
        ],
      },
      plausible: { min: 0, max: 100000 },
      howToMeasure: [
        'Nothing to measure: the app works it out from your dosimeter readouts.',
        'A rate 3× the mission’s normal level or more can mean a solar particle event.',
      ],
      sourceType: 'direct',
      sources: [
        'radi-n2-tracking-space-radiation-and-its-risks',
        'monitoring-radiation-for-astronaut-health',
      ],
    },
    {
      id: 'solarParticleEvent',
      name: 'Solar particle event alert',
      question: 'Solar particle event alert',
      input: 'severity',
      // Sent by mission control or the onboard monitor, not entered by the crew
      tier: 'auto',
      scaleLabels: ['None', 'Watch', 'Active event'],
      scoring: {
        kind: 'bands',
        bands: [
          { status: 'green', max: 1 },
          { status: 'amber', min: 1, max: 2 },
          { status: 'red', min: 2 },
        ],
      },
      plausible: { min: 0, max: 2 },
      howToMeasure: [
        'Nothing to measure: alerts come from mission control or the onboard radiation monitor.',
        'During an active event, go to the storm shelter or most shielded area.',
      ],
      // A real spaceflight radiation hazard, but not in the provided articles
      sourceType: 'added',
      sources: [],
    },
  ],
  actions: {
    green: ['Wear your dosimeter and keep to the planned schedule.'],
    amber: ['Spend more time in the most shielded areas.', 'Review planned spacewalks.'],
    red: ['Move to the storm shelter or most shielded area.', 'Defer spacewalks, and escalate.'],
  },
  pin: { side: 'right', order: 4, label: 'Radiation' },
  sources: [
    'risk-of-radiation-induced-cancers',
    'monitoring-radiation-for-astronaut-health',
    'radi-n2-tracking-space-radiation-and-its-risks',
    'little-transistor-records-radiation-levels',
    'mosfet-radiation-monitoring-system-and-matroshka-r',
  ],
}
