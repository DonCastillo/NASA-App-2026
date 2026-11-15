import type { MissionProfile, MissionProfileId } from '../types'

// The 3 mission profiles — plan/roadmap.md → Mission profiles.
// The selected mission pre-fills the mission length (editable in setup) and sets the comms delay,
// radiation rate, dose budget and escalation wording. Content only — no logic here.
// Default lengths are illustrative demo values: ISS missions in the articles run four to six months;
// the Moon and Mars figures are general spaceflight knowledge, not from the articles.

// Placeholders filled in by the next steps of plan/tasks.md 1.3:
//   commsDelay → step 2 · radiationPerDayMicroSv, doseBudgetMilliSv → step 3 · escalation → step 4
const TODO_DELAY = { kind: 'fixed', seconds: 0 } as const
const TODO_ESCALATION = { green: '', amber: '', red: '' }

export const MISSIONS: Record<MissionProfileId, MissionProfile> = {
  iss: {
    id: 'iss',
    name: 'ISS',
    defaultLengthDays: 180,
    trip: 'stay',
    lengthCovers: 'Stay on the station',
    commsDelay: TODO_DELAY,
    radiationPerDayMicroSv: 0,
    doseBudgetMilliSv: 0,
    resupply: true,
    environment: ['Low Earth orbit, inside Earth’s protective magnetosphere', 'Resupply available'],
    escalation: TODO_ESCALATION,
  },
  artemis: {
    id: 'artemis',
    name: 'Artemis lunar',
    defaultLengthDays: 30,
    trip: 'roundTrip',
    lengthCovers: 'Round trip: Earth → Moon → Earth',
    commsDelay: TODO_DELAY,
    radiationPerDayMicroSv: 0,
    doseBudgetMilliSv: 0,
    resupply: false,
    environment: [
      'Outside Earth’s magnetosphere',
      'Gravity transitions: lunar landing, surface spacewalks, launch and return',
    ],
    escalation: TODO_ESCALATION,
  },
  mars: {
    id: 'mars',
    name: 'Mars transit',
    defaultLengthDays: 210,
    trip: 'oneWay',
    lengthCovers: 'One way: Earth → Mars',
    commsDelay: TODO_DELAY,
    radiationPerDayMicroSv: 0,
    doseBudgetMilliSv: 0,
    resupply: false,
    environment: [
      'Deep space, far outside Earth’s magnetosphere: highest radiation',
      'No resupply',
      'The crew must act on its own while messages to Earth are delayed',
    ],
    escalation: TODO_ESCALATION,
  },
}

/** Missions in display order for the Mission ▾ switcher and the setup form */
export const MISSION_LIST: MissionProfile[] = [MISSIONS.iss, MISSIONS.artemis, MISSIONS.mars]
