import type { EventTypeDef } from '../types'

// Event types for the "Log event" overlay (plan/site-map.md → Overlays → B. Log event).
// Logging an event queues follow-up checks; logging an upcoming landing asks the pre-landing questions.
// Content only — the tasks themselves are created in src/lib/scheduler.ts.
export const EVENT_TYPES: EventTypeDef[] = [
  {
    id: 'spacewalk',
    label: 'Spacewalk',
    description: 'Time outside in a spacesuit. Spacewalk radiation doses can be much higher.',
    followUpIndicators: ['cumulativeDose'], // dosimeter readout after every spacewalk
    beforeEventQuestions: [],
  },
  {
    id: 'landing',
    label: 'Landing / docking',
    description: 'Touchdown on the Moon, Mars or Earth, or docking that changes gravity.',
    followUpIndicators: ['motionSickness', 'dizziness', 'balanceTest'],
    beforeEventQuestions: ['fluidLoading', 'compressionGarments'],
  },
  {
    id: 'gravityTransition',
    label: 'Gravity transition',
    description: 'Any other change in gravity, e.g. a surface spacewalk or launch.',
    followUpIndicators: ['motionSickness', 'dizziness', 'balanceTest'],
    beforeEventQuestions: [],
  },
]
