import type { MissionProfile, MissionProfileId } from '../types'

// The 3 mission profiles — plan/roadmap.md → Mission profiles.
// The selected mission pre-fills the mission length (editable in setup) and sets the comms delay,
// radiation rate, dose budget and escalation wording. Content only — no logic here.
// Default lengths are illustrative demo values: ISS missions in the articles run four to six months;
// the Moon and Mars figures are general spaceflight knowledge, not from the articles.

// Radiation (illustrative demo values):
// - radiationPerDayMicroSv is the total daily dose a personal dosimeter would show.
//   ISS: neutrons are ~30% of the ISS dose at ~150 µSv/day (radi-n2 article) → ~500 µSv/day in total.
//   Artemis and Mars: higher outside Earth's magnetosphere (general spaceflight knowledge, not the articles).
// - doseBudgetMilliSv is a built-in demo budget, never entered by the user. Each is sized so a whole
//   mission at the normal rate ends below 80% (red); extra exposure (spacewalks, solar particle events)
//   is what pushes a crew member into amber or red.

// Placeholder filled in by the next step of plan/tasks.md 1.3: escalation → step 4
const TODO_ESCALATION = { green: '', amber: '', red: '' }

export const MISSIONS: Record<MissionProfileId, MissionProfile> = {
  iss: {
    id: 'iss',
    name: 'ISS',
    defaultLengthDays: 180,
    trip: 'stay',
    lengthCovers: 'Stay on the station',
    // Near real time: under a second via relay satellites
    commsDelay: { kind: 'fixed', seconds: 0.5 },
    radiationPerDayMicroSv: 500, // 180 days → 90 mSv = 60% of budget
    doseBudgetMilliSv: 150,
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
    // Light takes about 1.3 s to cross the Earth–Moon distance
    commsDelay: { kind: 'fixed', seconds: 1.3 },
    radiationPerDayMicroSv: 1000, // 30 days → 30 mSv = 60% of budget
    doseBudgetMilliSv: 50,
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
    // Grows as the crew gets farther from Earth: ~0 at departure to ~20 min at arrival.
    // The delay on a given mission day is worked out in src/lib/derived.ts (task 2.3).
    commsDelay: { kind: 'growing', maxSeconds: 20 * 60 },
    radiationPerDayMicroSv: 1800, // 210 days → 378 mSv = 76% of budget
    doseBudgetMilliSv: 500,
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
