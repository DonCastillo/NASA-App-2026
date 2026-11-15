// Welcome cards, guided tour steps and first-time hints (plan/site-map.md → Overlays A and D,
// plan/tasks.md 7.2–7.4). Content only.

export const WELCOME_CARDS: { title: string; text: string }[] = [
  {
    title: 'Tap a system, see your status',
    text: 'Eight body systems on one figure, each green, amber or red, with the reason in plain words.',
  },
  {
    title: 'A 2-minute daily check-in',
    text: 'One question per screen, most answers one tap. Follow-ups appear only when they’re needed.',
  },
  {
    title: 'Guidance that adapts to your distance from Earth',
    text: 'What to do, and who to tell, changes with the communication delay of your mission.',
  },
]

/** A guided tour step: `target` is the element's data-tour attribute */
export type TourStep = { target: string; title: string; text: string }

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'pins',
    title: 'Body systems',
    text: 'Each pin is a body system. The color shows its status: green, amber or red.',
  },
  {
    target: 'pin-immune',
    title: 'One system',
    text: 'Tap a pin to see readings, trends and what to do.',
  },
  {
    target: 'daily-check-in',
    title: 'Daily check-in',
    text: 'Your 2-minute daily check-in. Most answers are one tap.',
  },
  {
    target: 'bell',
    title: 'Notifications',
    text: 'Pending tasks appear here, most important first.',
  },
  {
    target: 'log-event',
    title: 'Log event',
    text: 'Log a spacewalk or landing. The app will ask the right follow-up checks.',
  },
  {
    target: 'mission',
    title: 'Mission',
    text: 'Switch missions to see how guidance changes with distance from Earth.',
  },
]

/** First-time hints, shown once each */
export const HINTS = {
  checkIn: 'Tap an answer to move on. You can skip anything.',
  systemDetail: 'Start with “What to do now”. Details are below.',
} as const

export type HintId = keyof typeof HINTS
