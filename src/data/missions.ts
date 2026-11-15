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

// Escalation (plan/body-systems.md → Escalation by mission): who to tell and how fast, by status.
// The farther from Earth, the more the crew and the CMO (crew medical officer) act on their own.

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
    escalation: {
      green: 'No escalation needed.',
      amber: 'Tell the CMO. It goes in the daily report to the ground.',
      red: 'Call the flight surgeons now.',
    },
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
    escalation: {
      green: 'No escalation needed.',
      amber: 'Tell the CMO. It goes in the daily report.',
      red: 'Call the flight surgeons, and start the onboard protocol while connecting.',
    },
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
    escalation: {
      green: 'No escalation needed.',
      amber: 'The CMO decides. It goes in the next scheduled downlink.',
      red: 'Start the onboard protocol first; the CMO leads care. Send a report to the flight surgeons and act on their reply when it arrives.',
    },
  },
}

/** Missions in display order for the Mission ▾ switcher and the setup form */
export const MISSION_LIST: MissionProfile[] = [MISSIONS.iss, MISSIONS.artemis, MISSIONS.mars]
