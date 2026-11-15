import { differenceInCalendarDays, differenceInHours } from 'date-fns'
import { COUNTERMEASURES } from '../data/countermeasures'
import { EVENT_TYPES } from '../data/events'
import { SYMPTOM_OPTIONS } from '../data/symptoms'
import { SYSTEMS } from '../data/systems'
import type {
  CheckIn,
  CheckInMode,
  Indicator,
  IndicatorId,
  MissionEvent,
  MissionProfile,
  Profile,
  Reading,
  ReadingValue,
} from '../types'
import { scoreIndicator, type References } from './status'

// The check-in engine (plan/tasks.md 5.1, plan/body-systems.md → Check-in design).
// Pure: given the context and the answers so far, it returns the full ordered question list.
// The check-in page calls it again after every answer, so follow-ups appear as soon as they apply.

// ─────────────────────────────────────────────────────────────────────────────
// Questions and answers
// ─────────────────────────────────────────────────────────────────────────────

export type Question =
  /** A health indicator; `reason` says why a follow-up is asked, e.g. "You slept under 7 h" */
  | { kind: 'indicator'; key: IndicatorId; indicatorId: IndicatorId; reason?: string }
  | { kind: 'symptomGate'; key: 'symptoms' }
  | { kind: 'symptomList'; key: 'symptomList' }
  | { kind: 'countermeasure'; key: `cm:${string}`; questionId: string }
  | { kind: 'note'; key: 'note' }

/**
 * Answers by question key. Indicator answers use the indicator id. `null` = skipped.
 * symptoms → boolean · symptomList → symptom ids · cm:<id> → answer text · note → text
 */
export type Answers = Record<string, ReadingValue | string | undefined>

export type CheckInContext = {
  mode: CheckInMode
  profile: Profile
  mission: MissionProfile
  /** Now (the check-in time) */
  now: Date
  references: References
  /** Past check-ins of this profile on this mission (for weekly items and weekly medication) */
  checkIns: CheckIn[]
  events: MissionEvent[]
}

/** The 6 core readings, in the order they are asked; "Any symptoms today?" comes after them */
export const CORE_INDICATORS: IndicatorId[] = [
  'bloodPressure',
  'restingHeartRate',
  'bodyTemperature',
  'sleepHours',
  'mood',
  'exerciseMinutes',
]

const ALL_INDICATORS: Indicator[] = SYSTEMS.flatMap((system) => system.indicators)
const indicatorById = new Map(ALL_INDICATORS.map((i) => [i.id, i]))
const systemOf = (id: IndicatorId) => SYSTEMS.find((s) => s.indicators.some((i) => i.id === id))!

/** Indicators the crew can enter (not calculated, not sent in by mission control) */
export const isAskable = (indicator: Indicator) =>
  indicator.input !== 'calculated' && indicator.id !== 'solarParticleEvent'

const num = (value: Answers[string]) => (typeof value === 'number' ? value : undefined)
const atLeast = (value: Answers[string], n: number) => (num(value) ?? -Infinity) >= n
const below = (value: Answers[string], n: number) => (num(value) ?? Infinity) < n

/** Status of an answered indicator (amber/red trigger the rest of its system) */
function answeredStatus(id: IndicatorId, answers: Answers, references: References) {
  const indicator = indicatorById.get(id)
  const value = answers[id]
  if (!indicator || value === undefined || typeof value === 'string') return 'none'
  return scoreIndicator(indicator, value, references[id])
}

// ─────────────────────────────────────────────────────────────────────────────
// Due items (weekly indicators and weekly medication)
// ─────────────────────────────────────────────────────────────────────────────

/** Days since an indicator was last recorded (Infinity if never) */
function daysSinceReading(id: IndicatorId, checkIns: CheckIn[], now: Date): number {
  const times = checkIns.flatMap((c) =>
    c.readings.filter((r) => r.indicatorId === id && r.value !== null).map((r) => r.recordedAt),
  )
  if (!times.length) return Infinity
  const last = times.reduce((a, b) => (a > b ? a : b))
  return differenceInCalendarDays(now, new Date(last))
}

/** Days since a countermeasure question was last answered (Infinity if never) */
function daysSinceAnswer(questionId: string, checkIns: CheckIn[], now: Date): number {
  const times = checkIns.flatMap((c) =>
    c.countermeasures.filter((a) => a.questionId === questionId).map((a) => a.recordedAt),
  )
  if (!times.length) return Infinity
  const last = times.reduce((a, b) => (a > b ? a : b))
  return differenceInCalendarDays(now, new Date(last))
}

/** Weekly indicators due in today's check-in: not recorded in the last 7 days */
export function weeklyDue(checkIns: CheckIn[], now: Date): IndicatorId[] {
  return ALL_INDICATORS.filter(
    (i) => i.tier === 'weekly' && isAskable(i) && daysSinceReading(i.id, checkIns, now) >= 7,
  ).map((i) => i.id)
}

// ─────────────────────────────────────────────────────────────────────────────
// Building the question list
// ─────────────────────────────────────────────────────────────────────────────

/** An ordered set of questions that ignores repeats (the first reason wins) */
class QuestionList {
  private items: Question[] = []
  private keys = new Set<string>()
  add(question: Question) {
    if (this.keys.has(question.key)) return
    this.keys.add(question.key)
    this.items.push(question)
  }
  indicator(id: IndicatorId, reason?: string) {
    const indicator = indicatorById.get(id)
    if (indicator && isAskable(indicator))
      this.add({ kind: 'indicator', key: id, indicatorId: id, reason })
  }
  countermeasure(questionId: string) {
    this.add({ kind: 'countermeasure', key: `cm:${questionId}`, questionId })
  }
  has(key: string) {
    return this.keys.has(key)
  }
  toArray() {
    return this.items
  }
}

/** Indicator ids for a task link, e.g. "recheck-bodyTemperature", "weekly-nearVision", "event-landing" */
export function taskIndicatorIds(taskId: string): IndicatorId[] {
  const [kind, ...rest] = taskId.split('-')
  const target = rest.join('-')
  if (kind === 'recheck' || kind === 'weekly') return indicatorById.has(target) ? [target] : []
  if (kind === 'event') return EVENT_TYPES.find((e) => e.id === target)?.followUpIndicators ?? []
  return []
}

/** A landing or gravity transition in the last 24 hours */
const recentGravityChange = (events: MissionEvent[], now: Date) =>
  events.some((e) => {
    const hours = differenceInHours(now, new Date(e.at))
    return (e.type === 'landing' || e.type === 'gravityTransition') && hours >= 0 && hours <= 24
  })

/** A landing coming up in the next 24 hours */
const landingSoon = (events: MissionEvent[], now: Date) =>
  events.some((e) => {
    const hours = differenceInHours(new Date(e.at), now)
    return e.type === 'landing' && hours >= 0 && hours <= 24
  })

/** The full ordered question list for the answers so far */
export function buildQuestions(ctx: CheckInContext, answers: Answers): Question[] {
  const { mode, profile, mission, now, references, checkIns, events } = ctx
  const list = new QuestionList()

  // 1. The base questions for the mode
  if (mode.kind === 'daily') {
    for (const id of CORE_INDICATORS) list.indicator(id)
    list.add({ kind: 'symptomGate', key: 'symptoms' })
  } else if (mode.kind === 'system') {
    const system = SYSTEMS.find((s) => s.id === mode.systemId)
    for (const indicator of system?.indicators ?? []) list.indicator(indicator.id)
  } else {
    for (const id of taskIndicatorIds(mode.taskId)) list.indicator(id)
  }

  // 2. Symptoms: the tap list, then each tapped symptom's own question
  if (answers.symptoms === true) {
    list.add({ kind: 'symptomList', key: 'symptomList' })
    const tapped = Array.isArray(answers.symptomList) ? (answers.symptomList as string[]) : []
    for (const option of SYMPTOM_OPTIONS.filter((o) => tapped.includes(o.id))) {
      for (const id of option.asks) list.indicator(id, `You noted: ${option.label.toLowerCase()}`)
    }
  }

  // 3. Follow-up rules (plan/body-systems.md → Triggers for follow-ups)
  if (list.has('mood') && atLeast(answers.mood, 1) && !atLeast(answers.mood, 4)) {
    list.indicator('stress', 'Your mood is OK or lower')
    list.indicator('sleepQuality', 'Your mood is OK or lower')
  }
  if (list.has('sleepHours') && below(answers.sleepHours, 7)) {
    list.indicator('sleepQuality', 'You slept under 7 h')
  }
  if (list.has('bodyTemperature') && atLeast(answers.bodyTemperature, 37.3)) {
    list.indicator('immuneSymptoms', 'Your temperature is raised')
  }
  for (const id of CORE_INDICATORS) {
    if (!list.has(id)) continue
    const status = answeredStatus(id, answers, references)
    if (status !== 'amber' && status !== 'red') continue
    const system = systemOf(id)
    for (const indicator of system.indicators.filter((i) => i.tier === 'followUp')) {
      list.indicator(indicator.id, `${indicatorById.get(id)!.name} is out of range`)
    }
  }
  if (recentGravityChange(events, now)) {
    list.indicator('motionSickness', 'After a gravity change')
    list.indicator('dizziness', 'After a gravity change')
    if (mission.id === 'artemis') list.indicator('balanceTest', 'After a gravity change')
  }

  // 4. Weekly items due (daily check-in only)
  if (mode.kind === 'daily') {
    for (const id of weeklyDue(checkIns, now)) list.indicator(id, 'Due this week')
  }

  // 5. Countermeasure and medication questions (never change scores; give context to readings)
  const asked = (id: IndicatorId) => list.has(id)
  const bpOrHrOff = ['bloodPressure', 'restingHeartRate'].some((id) =>
    ['amber', 'red'].includes(answeredStatus(id, answers, references)),
  )
  const poorSleep =
    below(answers.sleepHours, 6) || (asked('sleepQuality') && below(answers.sleepQuality, 3))

  if (atLeast(answers.headache, 1) || atLeast(answers.blurredVision, 1))
    list.countermeasure('thighCuffs')
  if (atLeast(answers.motionSickness, 1) || atLeast(answers.dizziness, 1)) {
    list.countermeasure('motionSicknessMedicine')
  }
  if (bpOrHrOff || poorSleep) list.countermeasure('caffeine')
  if (bpOrHrOff) list.countermeasure('exerciseBeforeReading')
  if (
    atLeast(answers.headache, 1) ||
    atLeast(answers.backPain, 1) ||
    atLeast(answers.bodyTemperature, 37.3)
  ) {
    list.countermeasure('painOrFeverMedicine')
  }
  if (poorSleep) list.countermeasure('brightLight')
  if (landingSoon(events, now)) {
    list.countermeasure('fluidLoading')
    list.countermeasure('compressionGarments')
  }
  if (mode.kind === 'daily') {
    for (const q of COUNTERMEASURES.filter((c) => c.group === 'routine' && c.onlyIfProfileHas)) {
      const listed = q.onlyIfProfileHas!.some((id) => profile.supplements.includes(id))
      if (!listed) continue
      const weekly = q.id === 'boneMedication'
      if (!weekly || daysSinceAnswer(q.id, checkIns, now) >= 7) list.countermeasure(q.id)
    }
  }

  // 6. Optional note, always last
  list.add({ kind: 'note', key: 'note' })
  return list.toArray()
}

// ─────────────────────────────────────────────────────────────────────────────
// Answers → saved check-in
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The check-in to save. Answered indicators become readings; asked-but-skipped ones are saved as
 * null ("not recorded", never red); tapped yes/no symptoms are saved as true.
 */
export function buildCheckIn(
  ctx: CheckInContext,
  questions: Question[],
  answers: Answers,
  id: string,
  startedAt: string,
): CheckIn {
  const at = ctx.now.toISOString()
  const readings: Reading[] = []
  for (const question of questions) {
    if (question.kind !== 'indicator') continue
    const value = answers[question.key]
    readings.push({
      indicatorId: question.indicatorId,
      value: value === undefined || typeof value === 'string' ? null : value,
      recordedAt: at,
    })
  }
  const tapped = Array.isArray(answers.symptomList) ? (answers.symptomList as string[]) : []
  for (const option of SYMPTOM_OPTIONS.filter((o) => tapped.includes(o.id))) {
    for (const indicatorId of option.recordsYes ?? [])
      readings.push({ indicatorId, value: true, recordedAt: at })
  }
  const countermeasures = questions.flatMap((q) =>
    q.kind === 'countermeasure' && typeof answers[q.key] === 'string'
      ? [{ questionId: q.questionId, answer: answers[q.key] as string, recordedAt: at }]
      : [],
  )
  const note =
    typeof answers.note === 'string' && answers.note.trim() ? answers.note.trim() : undefined
  return {
    id,
    profileId: ctx.profile.id,
    missionId: ctx.mission.id,
    mode: ctx.mode,
    startedAt,
    completedAt: at,
    readings,
    countermeasures,
    note,
  }
}
