import type { CheckInTier, SourceType, Status } from '../types'

// Text for the About page (plan/site-map.md → About, plan/tasks.md 7.1). Content only.

export const ABOUT_INTRO =
  'BodyMap is a self-check tool for astronauts on long missions. Tap a body system on the figure to see its status, its readings and trends, and what to do next, worded for how far the crew is from Earth.'

/** What each status means (the color, icon and word come from statusDisplay.ts) */
export const STATUS_MEANING: Record<Status, string> = {
  green: 'Readings are in the expected range. Keep up the routine.',
  amber: 'Something is drifting or a symptom appeared. Watch it, act on the advice, recheck.',
  red: 'Out of range. Act now and tell the CMO or the flight surgeons, as the mission allows.',
  none: 'No recent reading, so no status. Check in to fill it.',
}

/** The check-in tiers (plan/body-systems.md → Check-in design) */
export const TIER_MEANING: { tier: CheckInTier; name: string; text: string }[] = [
  {
    tier: 'core',
    name: 'Every morning',
    text: 'A 2-minute daily check-in: sleep, mood, temperature, blood pressure, heart rate and exercise.',
  },
  {
    tier: 'followUp',
    name: 'Only when needed',
    text: 'Follow-up questions open when an answer calls for them, e.g. "headache: yes" asks about vision.',
  },
  {
    tier: 'weekly',
    name: 'Once a week',
    text: 'Near vision, strength, body mass, blood glucose, radiation dose and crew relations, spread over the week.',
  },
  {
    tier: 'auto',
    name: 'Automatic or after events',
    text: 'Calculated values (e.g. estimated bone loss), dosimeter feeds, and balance checks after a logged landing.',
  },
]

export const COMMS_DELAY_TEXT =
  'Guidance changes with the communication delay. On the ISS, the ground answers in under a second, so a red status means "call the flight surgeons now". On the way to Mars, a message takes up to 20 minutes each way, so the crew and the crew medical officer (CMO) start the onboard protocol themselves while the ground catches up.'

/** Where an indicator comes from (plan/health-indicators.md → Source types) */
export const SOURCE_TYPE_MEANING: Record<SourceType, { label: string; text: string }> = {
  direct: {
    label: 'Direct',
    text: 'Named in the challenge statement or an article',
  },
  proxy: {
    label: 'Proxy',
    text: 'An article names the risk; we chose an in-flight self-check to watch for it',
  },
  added: {
    label: 'Added',
    text: 'Not in the provided sources; added from general spaceflight knowledge',
  },
}

/** Project links shown under the About intro */
export const PROJECT_LINKS: { label: string; url: string }[] = [
  {
    label: 'Demo presentation (PDF)',
    url: 'https://github.com/DonCastillo/bodymap/blob/main/docs/BodyMap%20Crew%20Health%20%E2%80%94%20Demo.pdf',
  },
  { label: 'Source code on GitHub', url: 'https://github.com/DonCastillo/bodymap' },
]

export const DISCLAIMER =
  'Demo software built for the 2026 NASA Space Apps Challenge. Thresholds and guidance are illustrative demo values, not medical advice. Demo crew data is generated; anything you enter stays in this browser.'
