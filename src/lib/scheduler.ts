import { addDays, addHours, differenceInCalendarDays, format, setHours, startOfDay } from 'date-fns'
import { EVENT_TYPES } from '../data/events'
import { DEFAULT_RECHECK, RECHECKS } from '../data/rechecks'
import { DAILY_DUE_HOUR, DAILY_OVERDUE_HOUR, WEEKLY_SLOTS } from '../data/schedule'
import { SYSTEMS } from '../data/systems'
import type {
  CheckIn,
  IndicatorId,
  MissionEvent,
  MissionProfile,
  Profile,
  SystemId,
  Task,
  TaskKind,
  TaskState,
  TaskUrgency,
} from '../types'
import { parseLocalDate } from './derived'
import type { Health } from './health'

// The mission routine (plan/tasks.md 6.1): which tasks are upcoming, due, overdue or done right now.
// Pure: everything, including the time, is passed in. Used by the 🔔 bell, the Routine page and the
// nav badges. A skipped reading never counts as done, so skipped items come back in the next prompt.

export type ScheduleInput = {
  profile: Profile
  mission: MissionProfile
  checkIns: CheckIn[]
  events: MissionEvent[]
  health: Health
  now: Date
}

const ALL_INDICATORS = SYSTEMS.flatMap((s) => s.indicators)
const indicatorName = (id: IndicatorId) => ALL_INDICATORS.find((i) => i.id === id)?.name ?? id
const systemOf = (id: IndicatorId): SystemId | undefined =>
  SYSTEMS.find((s) => s.indicators.some((i) => i.id === id))?.id
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

/** Priority: lower comes first */
const PRIORITY: Record<TaskKind | 'redRecheck' | 'overdueWeekly', number> = {
  redRecheck: 1,
  postEvent: 2,
  preLanding: 2,
  dailyCheckIn: 3,
  recheck: 4, // amber recheck
  overdueWeekly: 5,
  weekly: 6,
}

export const taskLink = (id: string) => (id === 'daily' ? '/check-in' : `/check-in?task=${id}`)

/** First non-skipped reading of an indicator at or after a time */
function readingSince(checkIns: CheckIn[], ids: IndicatorId[], since: Date) {
  let first: string | undefined
  for (const checkIn of checkIns) {
    for (const r of checkIn.readings) {
      if (!ids.includes(r.indicatorId) || r.value === null) continue
      if (new Date(r.recordedAt) < since) continue
      if (!first || r.recordedAt < first) first = r.recordedAt
    }
  }
  return first
}

/** First answer to a countermeasure question at or after a time */
function answerSince(checkIns: CheckIn[], questionId: string, since: Date) {
  let first: string | undefined
  for (const checkIn of checkIns) {
    for (const a of checkIn.countermeasures) {
      if (a.questionId !== questionId || new Date(a.recordedAt) < since) continue
      if (!first || a.recordedAt < first) first = a.recordedAt
    }
  }
  return first
}

/** Mission day of a date (day 1 = start date) */
const missionDay = (profile: Profile, date: Date) =>
  differenceInCalendarDays(date, parseLocalDate(profile.mission.startDate)) + 1
/** The date of a mission day */
const dateOfDay = (profile: Profile, day: number) =>
  addDays(parseLocalDate(profile.mission.startDate), day - 1)

function stateFor(now: Date, dueAt: Date, overdueAt: Date, doneAt?: string): TaskState {
  if (doneAt) return 'done'
  if (now < dueAt) return 'upcoming'
  return now >= overdueAt ? 'overdue' : 'due'
}

// ─────────────────────────────────────────────────────────────────────────────
// Task builders
// ─────────────────────────────────────────────────────────────────────────────

function dailyTask({ checkIns, now }: ScheduleInput): Task {
  const today = startOfDay(now)
  const done = checkIns.find(
    (c) =>
      c.mode.kind === 'daily' &&
      c.completedAt &&
      differenceInCalendarDays(now, new Date(c.startedAt)) === 0,
  )
  const dueAt = setHours(today, DAILY_DUE_HOUR)
  return {
    id: 'daily',
    kind: 'dailyCheckIn',
    title: 'Daily check-in',
    indicatorIds: [],
    dueAt: dueAt.toISOString(),
    // Before 06:00 it is still due (it can be done any time today)
    state: done ? 'done' : now >= setHours(today, DAILY_OVERDUE_HOUR) ? 'overdue' : 'due',
    doneAt: done?.completedAt,
    priority: PRIORITY.dailyCheckIn,
    link: taskLink('daily'),
  }
}

/** Weekly items on their day of the mission week; overdue until recorded */
function weeklyTasks({ profile, checkIns, now }: ScheduleInput): Task[] {
  const today = missionDay(profile, now)
  if (today < 1) return []
  return Object.entries(WEEKLY_SLOTS).flatMap(([id, slot]) => {
    // The most recent scheduled day up to today (none before day 1)
    const day = today - ((((today - slot!) % 7) + 7) % 7)
    if (day < 1) return []
    const scheduled = dateOfDay(profile, day)
    const doneAt = readingSince(checkIns, [id], scheduled)
    const isToday = day === today
    const state: TaskState = doneAt ? 'done' : isToday ? 'due' : 'overdue'
    return [
      {
        id: `weekly-${id}`,
        kind: 'weekly' as const,
        title: indicatorName(id),
        systemId: systemOf(id),
        indicatorIds: [id],
        dueAt: setHours(scheduled, DAILY_DUE_HOUR).toISOString(),
        state,
        doneAt,
        priority: state === 'overdue' ? PRIORITY.overdueWeekly : PRIORITY.weekly,
        link: taskLink(`weekly-${id}`),
      },
    ]
  })
}

/**
 * A recheck for every amber/red indicator with its own recheck interval (temperature, BP, …), and
 * for a follow-up symptom driving its system (rechecked tomorrow). Core and weekly items without a
 * rule are not duplicated: tomorrow's daily check-in or the next weekly slot asks them anyway.
 */
function recheckTasks({ health, checkIns, now }: ScheduleInput): Task[] {
  const tasks: Task[] = []
  for (const system of SYSTEMS) {
    const systemHealth = health.systems[system.id]
    for (const result of systemHealth.indicators) {
      if (result.status !== 'amber' && result.status !== 'red') continue
      const indicator = system.indicators.find((i) => i.id === result.indicatorId)
      if (!indicator || indicator.input === 'calculated' || indicator.tier === 'auto') continue
      const rule = RECHECKS[indicator.id]
      const followUpDriver =
        indicator.tier === 'followUp' && result.indicatorId === systemHealth.driverId
      if (!rule && !followUpDriver) continue
      const points = health.history[indicator.id] ?? []
      const last = [...points].reverse().find((p) => p.value !== null)
      if (!last) continue
      const { hours } = rule ?? DEFAULT_RECHECK
      const takenAt = new Date(last.recordedAt)
      const dueAt = addHours(takenAt, hours)
      const overdueAt = addHours(dueAt, Math.max(1, hours / 2))
      const urgency = result.status as TaskUrgency
      const id = `recheck-${indicator.id}`
      tasks.push({
        id,
        kind: 'recheck',
        title: `Recheck ${lowerFirst(indicator.name)}`,
        systemId: system.id,
        indicatorIds: [indicator.id],
        dueAt: dueAt.toISOString(),
        state: stateFor(
          now,
          dueAt,
          overdueAt,
          readingSince(checkIns, [indicator.id], addHours(takenAt, 0.01)),
        ),
        priority: urgency === 'red' ? PRIORITY.redRecheck : PRIORITY.recheck,
        urgency,
        link: taskLink(id),
      })
    }
  }
  return tasks
}

/** Follow-ups after landings, gravity transitions and spacewalks in the last 24 h */
function postEventTasks({ events, checkIns, now }: ScheduleInput): Task[] {
  return events.flatMap((event) => {
    const at = new Date(event.at)
    const hoursAgo = (now.getTime() - at.getTime()) / 3_600_000
    if (hoursAgo < 0 || hoursAgo > 24) return []
    const def = EVENT_TYPES.find((e) => e.id === event.type)!
    const id = `event-${event.type}`
    const title =
      event.type === 'spacewalk'
        ? 'Dosimeter readout after spacewalk'
        : `After ${lowerFirst(def.label)}: balance check`
    return [
      {
        id,
        kind: 'postEvent' as const,
        title,
        indicatorIds: def.followUpIndicators,
        dueAt: event.at,
        state: stateFor(
          now,
          at,
          addHours(at, 12),
          readingSince(checkIns, def.followUpIndicators, at),
        ),
        priority: PRIORITY.postEvent,
        link: taskLink(id),
      },
    ]
  })
}

/** Pre-landing countermeasures in the 24 h before a logged landing */
function preLandingTasks({ events, checkIns, now }: ScheduleInput): Task[] {
  return events.flatMap((event) => {
    if (event.type !== 'landing') return []
    const at = new Date(event.at)
    const from = addHours(at, -24)
    if (now < from || now > at) return []
    const id = `prelanding-${event.id}`
    return [
      {
        id,
        kind: 'preLanding' as const,
        title: 'Before landing: fluid loading and compression garments',
        indicatorIds: [],
        dueAt: from.toISOString(),
        state: answerSince(checkIns, 'fluidLoading', from)
          ? 'done'
          : now >= addHours(at, -3)
            ? 'overdue'
            : 'due',
        doneAt: answerSince(checkIns, 'fluidLoading', from),
        priority: PRIORITY.preLanding,
        link: taskLink(id),
      },
    ]
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

const STATE_ORDER: Record<TaskState, number> = { overdue: 0, due: 1, upcoming: 2, done: 3 }

/** Every task for today (including done and upcoming ones), most important first */
export function scheduleTasks(input: ScheduleInput): Task[] {
  return [
    ...recheckTasks(input),
    ...postEventTasks(input),
    ...preLandingTasks(input),
    dailyTask(input),
    ...weeklyTasks(input),
  ].sort(
    (a, b) =>
      STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
      a.priority - b.priority ||
      a.dueAt.localeCompare(b.dueAt),
  )
}

/** Tasks that need doing now (due or overdue): the 🔔 list and the nav badges */
export const pendingTasks = (tasks: Task[]) =>
  tasks
    .filter((t) => t.state === 'due' || t.state === 'overdue')
    .sort((a, b) => a.priority - b.priority || a.dueAt.localeCompare(b.dueAt))

/** The Routine page's "Today": everything still open, plus what was done today */
export const todayTasks = (tasks: Task[], now: Date) =>
  tasks.filter(
    (t) =>
      t.state !== 'done' ||
      (t.doneAt !== undefined && differenceInCalendarDays(now, new Date(t.doneAt)) === 0),
  )

/** Weekly items scheduled in the next 6 days, for the Routine page's "This week" */
export function weekAhead(profile: Profile, now: Date): { date: Date; items: string[] }[] {
  const today = missionDay(profile, now)
  const days: { date: Date; items: string[] }[] = []
  for (let offset = 1; offset <= 6; offset++) {
    const day = today + offset
    if (day < 1 || day > profile.mission.lengthDays) continue
    const items = Object.entries(WEEKLY_SLOTS)
      .filter(([, slot]) => (((day - slot!) % 7) + 7) % 7 === 0)
      .map(([id]) => indicatorName(id))
    if (items.length) days.push({ date: dateOfDay(profile, day), items })
  }
  return days
}

/** "5 of 9 done this week": daily check-ins and weekly items over the last 7 days */
export function weekCompletion(input: ScheduleInput): { done: number; total: number } {
  const { profile, checkIns, now } = input
  const today = missionDay(profile, now)
  let done = 0
  let total = 0
  for (let offset = 0; offset < 7; offset++) {
    const day = today - offset
    if (day < 1) break
    const date = dateOfDay(profile, day)
    total++
    if (
      checkIns.some(
        (c) =>
          c.mode.kind === 'daily' &&
          c.completedAt &&
          differenceInCalendarDays(date, new Date(c.startedAt)) === 0,
      )
    ) {
      done++
    }
    for (const [id, slot] of Object.entries(WEEKLY_SLOTS)) {
      if ((((day - slot!) % 7) + 7) % 7 !== 0) continue
      total++
      if (readingSince(checkIns, [id], date)) done++
    }
  }
  return { done, total }
}

export type TaskTone = 'alert' | 'warn' | 'accent' | 'muted' | 'ok'

/** How a task row looks in the 🔔 list and on Routine: icon + word (never color alone) + tone */
export function taskDisplay(task: Task, now: Date): { icon: string; word: string; tone: TaskTone } {
  if (task.state === 'done') return { icon: '✓', word: 'done', tone: 'ok' }
  if (task.state === 'upcoming') {
    const due = new Date(task.dueAt)
    const days = differenceInCalendarDays(due, now)
    const day = days === 0 ? '' : days === 1 ? 'tomorrow ' : format(due, 'EEE ')
    return { icon: '○', word: `${day}${format(due, 'HH:mm')}`, tone: 'muted' }
  }
  if (task.urgency === 'red') return { icon: '✖', word: 'now', tone: 'alert' }
  if (task.state === 'overdue') return { icon: '⚠', word: 'late', tone: 'warn' }
  return { icon: '○', word: 'due', tone: 'accent' }
}

/** The bell's color: red if a red recheck is pending, amber if anything is overdue, else accent */
export function bellTone(pending: Task[]): 'alert' | 'warn' | 'accent' | 'none' {
  if (!pending.length) return 'none'
  if (pending.some((t) => t.urgency === 'red')) return 'alert'
  if (pending.some((t) => t.state === 'overdue')) return 'warn'
  return 'accent'
}

/** When the next daily check-in opens, for the empty 🔔 state: "tomorrow 06:00" */
export const nextDailyLabel = () => `tomorrow ${String(DAILY_DUE_HOUR).padStart(2, '0')}:00`
