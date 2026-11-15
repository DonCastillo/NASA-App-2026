// Shared TypeScript types for the whole app.
// Content (src/data), logic (src/lib), state (src/state) and UI all speak these types.
// Source of truth for the shapes: plan/body-systems.md and plan/site-map.md.

// ─────────────────────────────────────────────────────────────────────────────
// Body systems
// ─────────────────────────────────────────────────────────────────────────────

/** The 8 system slugs (plan/site-map.md → System slugs). Used in URLs and saved data: never change them. */
export const SYSTEM_IDS = [
  'heart',
  'eyes',
  'bones',
  'immune',
  'metabolism',
  'mind',
  'balance',
  'radiation',
] as const

/** One of the 8 system slugs, e.g. 'immune' in /system/immune */
export type SystemId = (typeof SYSTEM_IDS)[number]

/** A status an indicator or system can be scored as */
export type ScoredStatus = 'green' | 'amber' | 'red'

/** Status shown in the UI. 'none' = not recorded yet (grey, never red) */
export type Status = ScoredStatus | 'none'

// ─────────────────────────────────────────────────────────────────────────────
// Indicators and how they are scored
// ─────────────────────────────────────────────────────────────────────────────

/** Stable id of one of the 28 indicators, e.g. 'bloodPressure'. Defined in src/data/systems.ts */
export type IndicatorId = string

/**
 * How the user enters an indicator.
 * - number:     one value with −/+ stepper (heart rate 62)
 * - numberPair: two values (blood pressure 118/76)
 * - severity:   0–3 buttons: None · Mild · Moderate · Severe
 * - rating:     1–5 buttons with words/faces (mood, sleep quality)
 * - yesNo:      one tap (neck or arm swelling)
 * - checklist:  pick any from a list (immune symptoms)
 * - calculated: the app works it out; the user never enters it (bone-loss estimate)
 */
export type InputType =
  'number' | 'numberPair' | 'severity' | 'rating' | 'yesNo' | 'checklist' | 'calculated'

/**
 * When an indicator is asked (plan/body-systems.md → Check-in design → Tiers)
 * - core:     every morning (tier 1)
 * - followUp: only when a trigger opens it (tier 2)
 * - weekly:   once a week (tier 3)
 * - auto:     calculated, sent in from outside, or asked only after an event (tier 4)
 */
export type CheckInTier = 'core' | 'followUp' | 'weekly' | 'auto'

/** Where an indicator comes from (plan/health-indicators.md) */
export type SourceType = 'direct' | 'proxy' | 'added'

/**
 * One scoring band. A value is in the band when min ≤ value < max (half-open),
 * so 37.2 and 37.3 never fall between two bands. Omit min or max for an open end.
 * Bands are checked in order; the first match wins.
 */
export type Band = {
  status: ScoredStatus
  min?: number
  max?: number
}

/**
 * What a number is compared against before banding.
 * - absolute:                  the value itself (38.2 °C)
 * - percentOfBaseline:         value ÷ preflight baseline × 100 (strength 85% of baseline)
 * - changeFromBaseline:        value − baseline (vision: −1 line)
 * - percentChangeFromBaseline: (value − baseline) ÷ baseline × 100 (body mass −3%)
 * - percentOfBudget:           value ÷ mission dose budget × 100 (radiation 31%)
 * - multipleOfBaseline:        value ÷ mission baseline rate (dose rate 1.5×)
 */
export type ScoringBasis =
  | 'absolute'
  | 'percentOfBaseline'
  | 'changeFromBaseline'
  | 'percentChangeFromBaseline'
  | 'percentOfBudget'
  | 'multipleOfBaseline'

/** How one indicator's value becomes green / amber / red */
export type Scoring =
  /** Numbers and scales: compare (after `basis`) against ordered bands */
  | { kind: 'bands'; bands: Band[]; basis?: ScoringBasis }
  /** Two numbers (blood pressure): score each, the worse one wins */
  | { kind: 'pairBands'; first: Band[]; second: Band[] }
  /** Yes / no answers */
  | { kind: 'yesNo'; yes: ScoredStatus; no: ScoredStatus }
  /** Checklists: band on how many items are ticked; some items make it red on their own */
  | { kind: 'checklist'; countBands: Band[]; redIfAny?: string[] }

/** A rule that worsens the status when it repeats, e.g. sleep under 6 h for 3+ nights → red */
export type StreakRule = {
  /** The status that must repeat */
  when: ScoredStatus
  /** How many days in a row */
  days: number
  /** Only count days whose value is below this, e.g. exercise under 60 min (amber also covers 60–89) */
  below?: number
  /** The status it becomes */
  becomes: ScoredStatus
}

/** One option in a checklist indicator */
export type ChecklistOption = {
  id: string
  label: string
}

/** One of the 28 health indicators */
export type Indicator = {
  id: IndicatorId
  /** Short name, e.g. "Body temperature" */
  name: string
  /** The plain question asked in the check-in, e.g. "What's your body temperature?" */
  question: string
  /** Unit shown next to readings, e.g. "°C", "mmHg", "% of budget" */
  unit?: string
  input: InputType
  tier: CheckInTier
  scoring: Scoring
  /** Repeat rules handled by src/lib/trends.ts */
  streak?: StreakRule
  /** Values outside this range get a "please check the reading" prompt */
  plausible?: { min: number; max: number }
  /** Button words for severity / rating scales when the defaults don't fit, lowest value first
   *  (defaults: None · Mild · Moderate · Severe and Bad · Low · OK · Good · Great) */
  scaleLabels?: string[]
  /** Options for checklist inputs */
  options?: ChecklistOption[]
  /** Steps shown in "How do I measure this?" */
  howToMeasure: string[]
  sourceType: SourceType
  /** Article slugs in plan/articles/ (and 'challenge-statement') */
  sources: string[]
}

/** Position and label of a system's pin on the body figure (plan/branding.md §5) */
export type PinPlacement = {
  side: 'left' | 'right'
  /** Order from top to bottom within its column, starting at 1 */
  order: number
  /** Label next to the pin, e.g. "Eyes & brain" */
  label: string
}

/** One of the 8 body systems, with all of its content */
export type SystemDef = {
  id: SystemId
  /** Full name, e.g. "Eyes & brain (SANS)" */
  name: string
  /** Where it sits on the body, e.g. "head / eyes" */
  region: string
  /** One line on what the system does */
  whatItDoes: string
  /** "Why this changes in space" bullets, from the articles */
  whyInSpace: string[]
  indicators: Indicator[]
  /** What to do at each status */
  actions: Record<ScoredStatus, string[]>
  /** Extra advice outside the status actions, e.g. before landing */
  extraAdvice?: string[]
  pin: PinPlacement
  /** Article slugs in plan/articles/ */
  sources: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Missions
// ─────────────────────────────────────────────────────────────────────────────

export type MissionProfileId = 'iss' | 'artemis' | 'mars'

/** One-way communication delay with Earth */
export type CommsDelay =
  /** The same for the whole mission (ISS under 1 s, Artemis ~1.3 s) */
  | { kind: 'fixed'; seconds: number }
  /** Grows from ~0 at departure to maxSeconds at the end of the mission (Mars transit) */
  | { kind: 'growing'; maxSeconds: number }

/**
 * What the mission length covers.
 * - stay:      time at a destination (ISS: the stay on the station)
 * - roundTrip: there and back (Artemis: Earth → Moon → Earth)
 * - oneWay:    the outbound journey only (Mars transit: Earth → Mars)
 */
export type MissionTrip = 'stay' | 'roundTrip' | 'oneWay'

export type MissionProfile = {
  id: MissionProfileId
  /** e.g. "Mars transit" */
  name: string
  /** Pre-filled mission length; editable in setup (180 / 30 / 210) */
  defaultLengthDays: number
  trip: MissionTrip
  /** Shown next to the length in setup and the mission switcher, e.g. "One way: Earth → Mars" */
  lengthCovers: string
  commsDelay: CommsDelay
  /** Typical daily radiation dose on this mission, in µSv/day */
  radiationPerDayMicroSv: number
  /** Built-in demo dose budget for the whole mission, in mSv (never entered by the user) */
  doseBudgetMilliSv: number
  /** Can supplies be sent during the mission? */
  resupply: boolean
  /** Short environment notes, e.g. "Outside Earth's magnetosphere" */
  environment: string[]
  /** Escalation guidance per status, worded for this mission's comms delay */
  escalation: Record<ScoredStatus, string>
}

// ─────────────────────────────────────────────────────────────────────────────
// Crew profile
// ─────────────────────────────────────────────────────────────────────────────

export type Sex = 'female' | 'male'

/** Preflight values that indicators are compared against. Missing ones fall back to the first 7 days. */
export type Baselines = {
  restingSystolic?: number
  restingDiastolic?: number
  restingHeartRate?: number
  /** Result of the standard strength set on the resistive device */
  strengthScore?: number
  /** Lines read on the near-vision card */
  nearVisionLines?: number
  /** Seconds standing on one leg, eyes closed */
  balanceSeconds?: number
  typicalSleepHours?: number
}

/** The crew member's mission, as set in setup */
export type MissionSettings = {
  profileId: MissionProfileId
  /** ISO date, e.g. "2026-04-01" */
  startDate: string
  /** Pre-filled from the mission profile, editable */
  lengthDays: number
}

export type Profile = {
  id: string
  /** Display name or call sign, e.g. "Cmdr. Vega" */
  name: string
  /** Seeded demo crew member (generated, never stored) */
  isDemo: boolean
  age?: number
  sex?: Sex
  heightCm?: number
  preflightBodyMassKg?: number
  /** Ids of regular supplements / medications from the pick list (src/data) */
  supplements: string[]
  baselines: Baselines
  mission: MissionSettings
}

// ─────────────────────────────────────────────────────────────────────────────
// Recorded data
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A recorded value. Its shape follows the indicator's InputType:
 * number → number · numberPair → [a, b] · severity / rating → number ·
 * yesNo → boolean · checklist → ticked option ids · null → skipped ("not recorded")
 */
export type ReadingValue = number | [number, number] | boolean | string[] | null

/** One value for one indicator at one moment */
export type Reading = {
  indicatorId: IndicatorId
  value: ReadingValue
  /** ISO date-time */
  recordedAt: string
}

/** Which questions a check-in asks (from the URL: /check-in, ?system=, ?task=) */
export type CheckInMode =
  { kind: 'daily' } | { kind: 'system'; systemId: SystemId } | { kind: 'task'; taskId: string }

export type CountermeasureGroup = 'triggered' | 'routine' | 'preLanding'

/** A countermeasure or medication question (plan/body-systems.md → Countermeasure and medication questions) */
export type CountermeasureQuestion = {
  id: string
  /** e.g. "Did you wear thigh cuffs today?" */
  question: string
  /** Tap answers, e.g. ["No", "Yes, under 3 h", "Yes, 3 h or more"] */
  answers: string[]
  group: CountermeasureGroup
  /** Plain description of when it is asked; the rule itself lives in src/lib/triggers.ts */
  askedWhen: string
  /** How often it typically comes up, e.g. "Occasionally (symptom days)" */
  frequency: string
  /** Routine questions: only asked if the profile lists one of these pick-list ids */
  onlyIfProfileHas?: string[]
  /** Article slugs; empty when the basis is general practice */
  sources: string[]
}

/** One item in the "Regular supplements / medications" pick list in setup */
export type SupplementOption = {
  id: string
  /** e.g. "Daily B vitamin" */
  label: string
  kind: 'supplement' | 'medication'
  schedule: 'daily' | 'weekly'
  sources: string[]
}

export type CountermeasureAnswer = {
  questionId: string
  answer: string
  recordedAt: string
}

/** One completed (or in-progress) check-in */
export type CheckIn = {
  id: string
  profileId: string
  mode: CheckInMode
  startedAt: string
  /** Missing while the check-in is a saved draft */
  completedAt?: string
  readings: Reading[]
  countermeasures: CountermeasureAnswer[]
  note?: string
}

export type MissionEventType = 'spacewalk' | 'landing' | 'gravityTransition'

/** Content for one event type in the "Log event" overlay (src/data/events.ts) */
export type EventTypeDef = {
  id: MissionEventType
  /** e.g. "Landing / docking" */
  label: string
  /** One line shown under the option */
  description: string
  /** Indicators to check after the event (queued as a task) */
  followUpIndicators: IndicatorId[]
  /** Countermeasure questions to ask before the event, when it's logged ahead of time */
  beforeEventQuestions: string[]
}

/** Something logged with the "Log event" button */
export type MissionEvent = {
  id: string
  profileId: string
  type: MissionEventType
  /** ISO date-time; in the future for an upcoming landing */
  at: string
  note?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Tasks (🔔 bell and Routine page)
// ─────────────────────────────────────────────────────────────────────────────

export type TaskKind = 'dailyCheckIn' | 'weekly' | 'recheck' | 'postEvent' | 'preLanding'

export type TaskState = 'due' | 'overdue' | 'done'

export type Task = {
  id: string
  kind: TaskKind
  /** e.g. "Recheck temperature" */
  title: string
  systemId?: SystemId
  /** Indicators the matching check-in will ask */
  indicatorIds: IndicatorId[]
  /** ISO date-time */
  dueAt: string
  state: TaskState
  /** Lower comes first: red recheck → post-event → daily check-in → overdue weekly → weekly due */
  priority: number
}
