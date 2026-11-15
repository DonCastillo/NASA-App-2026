import { describe, expect, it } from 'vitest'
import { MISSIONS } from '../data/missions'
import type { CheckIn, IndicatorId, MissionEvent, Profile, ReadingValue } from '../types'
import { computeHealth } from './health'
import {
  bellTone,
  pendingTasks,
  scheduleTasks,
  taskDisplay,
  todayTasks,
  weekAhead,
  weekCompletion,
} from './scheduler'

// Mission started 1 Nov 2026 → 15 Nov is mission day 15 (15 % 7 = 1 → near vision's weekly slot)
const profile: Profile = {
  id: 'me',
  name: 'Me',
  isDemo: false,
  supplements: [],
  baselines: { nearVisionLines: 10 },
  mission: { profileId: 'iss', startDate: '2026-11-01', lengthDays: 180 },
}
const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute)

let n = 0
function checkIn(
  when: Date,
  readings: [IndicatorId, ReadingValue][],
  kind: 'daily' | 'task' = 'task',
  countermeasures: [string, string][] = [],
): CheckIn {
  const iso = when.toISOString()
  return {
    id: `c${n++}`,
    profileId: 'me',
    mode: kind === 'daily' ? { kind: 'daily' } : { kind: 'task', taskId: 'x' },
    startedAt: iso,
    completedAt: iso,
    readings: readings.map(([indicatorId, value]) => ({ indicatorId, value, recordedAt: iso })),
    countermeasures: countermeasures.map(([questionId, answer]) => ({
      questionId,
      answer,
      recordedAt: iso,
    })),
  }
}

function tasksAt(now: Date, checkIns: CheckIn[] = [], events: MissionEvent[] = []) {
  const health = computeHealth({ profile, checkIns, events }, MISSIONS.iss, now)
  return scheduleTasks({ profile, mission: MISSIONS.iss, checkIns, events, health, now })
}
const task = (tasks: ReturnType<typeof tasksAt>, id: string) => tasks.find((t) => t.id === id)

describe('daily check-in task', () => {
  it('is due in the morning, overdue after noon, done once completed today', () => {
    expect(task(tasksAt(at(15, 9)), 'daily')?.state).toBe('due')
    expect(task(tasksAt(at(15, 13)), 'daily')?.state).toBe('overdue')
    const done = tasksAt(at(15, 13), [checkIn(at(15, 8), [['mood', 4]], 'daily')])
    expect(task(done, 'daily')).toMatchObject({ state: 'done', link: '/check-in' })
  })
})

describe('weekly tasks', () => {
  it('spreads weekly items across the week: today’s is due, missed ones are overdue', () => {
    const tasks = tasksAt(at(15, 9))
    expect(task(tasks, 'weekly-nearVision')).toMatchObject({
      state: 'due',
      link: '/check-in?task=weekly-nearVision',
    })
    // Strength's slot (day 9) has passed without a reading
    expect(task(tasks, 'weekly-strengthTest')?.state).toBe('overdue')
  })

  it('is done once recorded since its scheduled day; a skipped reading does not count', () => {
    const tasks = tasksAt(at(15, 9), [
      checkIn(at(10, 8), [['strengthTest', 60]]),
      checkIn(at(15, 8), [['nearVision', null]]), // skipped
    ])
    expect(task(tasks, 'weekly-strengthTest')?.state).toBe('done')
    expect(task(tasks, 'weekly-nearVision')?.state).toBe('due') // comes back
  })
})

describe('recheck tasks', () => {
  const fever = [checkIn(at(15, 8), [['bodyTemperature', 38.4]])]

  it('schedules a red recheck 4–6 h after the reading, then marks it due and overdue', () => {
    expect(task(tasksAt(at(15, 10), fever), 'recheck-bodyTemperature')).toMatchObject({
      state: 'upcoming',
      urgency: 'red',
      title: 'Recheck body temperature',
      systemId: 'immune',
    })
    expect(task(tasksAt(at(15, 13, 30), fever), 'recheck-bodyTemperature')?.state).toBe('due')
    expect(task(tasksAt(at(15, 16), fever), 'recheck-bodyTemperature')?.state).toBe('overdue')
  })

  it('disappears once a new reading is back in range', () => {
    const tasks = tasksAt(at(15, 14), [...fever, checkIn(at(15, 13), [['bodyTemperature', 36.8]])])
    expect(task(tasks, 'recheck-bodyTemperature')).toBeUndefined()
  })

  it('rechecks a follow-up symptom driving its system tomorrow', () => {
    const tasks = tasksAt(at(15, 9), [checkIn(at(15, 8), [['stress', 3]])])
    const recheck = task(tasks, 'recheck-stress')!
    expect(recheck).toMatchObject({ urgency: 'amber', state: 'upcoming', systemId: 'mind' })
    expect(taskDisplay(recheck, at(15, 9)).word).toBe('tomorrow 08:00')
  })

  it('does not duplicate core or weekly items without a recheck rule', () => {
    // Short sleep: tomorrow's daily check-in asks again; a high dose: its weekly slot does
    const tasks = tasksAt(at(15, 9), [
      checkIn(at(15, 8), [
        ['sleepHours', 5],
        ['cumulativeDose', 900],
      ]),
    ])
    expect(tasks.filter((t) => t.kind === 'recheck')).toEqual([])
  })
})

describe('event tasks', () => {
  const landing: MissionEvent = {
    id: 'L',
    profileId: 'me',
    type: 'landing',
    at: at(15, 3).toISOString(),
  }

  it('asks for a post-landing check after a landing, done once followed up', () => {
    expect(task(tasksAt(at(15, 9), [], [landing]), 'event-landing')).toMatchObject({
      kind: 'postEvent',
      state: 'due',
      indicatorIds: ['motionSickness', 'dizziness', 'balanceTest'],
    })
    const followed = tasksAt(at(15, 9), [checkIn(at(15, 8), [['motionSickness', 1]])], [landing])
    expect(task(followed, 'event-landing')?.state).toBe('done')
    expect(task(tasksAt(at(16, 9), [], [landing]), 'event-landing')).toBeUndefined() // > 24 h later
  })

  it('asks for a dosimeter readout after a spacewalk', () => {
    const eva: MissionEvent = {
      id: 'E',
      profileId: 'me',
      type: 'spacewalk',
      at: at(15, 2).toISOString(),
    }
    expect(task(tasksAt(at(15, 9), [], [eva]), 'event-spacewalk')).toMatchObject({
      title: 'Dosimeter readout after spacewalk',
      indicatorIds: ['cumulativeDose'],
    })
  })

  it('asks the pre-landing questions in the 24 h before a landing', () => {
    const soon: MissionEvent = {
      id: 'S',
      profileId: 'me',
      type: 'landing',
      at: at(15, 20).toISOString(),
    }
    expect(task(tasksAt(at(15, 9), [], [soon]), 'prelanding-S')).toMatchObject({
      state: 'due',
      link: '/check-in?task=prelanding-S',
    })
    expect(task(tasksAt(at(15, 18), [], [soon]), 'prelanding-S')?.state).toBe('overdue') // < 3 h to go
    const answered = tasksAt(
      at(15, 12),
      [checkIn(at(15, 11), [], 'task', [['fluidLoading', 'Yes']])],
      [soon],
    )
    expect(task(answered, 'prelanding-S')?.state).toBe('done')
  })
})

describe('priority', () => {
  it('lists pending tasks: red recheck → post-event → daily check-in → overdue weekly → weekly due', () => {
    const landing: MissionEvent = {
      id: 'L',
      profileId: 'me',
      type: 'landing',
      at: at(15, 3).toISOString(),
    }
    const tasks = tasksAt(at(15, 14), [checkIn(at(15, 8), [['bodyTemperature', 38.4]])], [landing])
    const ids = pendingTasks(tasks).map((t) => t.id)
    expect(ids[0]).toBe('recheck-bodyTemperature')
    expect(ids[1]).toBe('event-landing')
    expect(ids[2]).toBe('daily')
    expect(ids.indexOf('weekly-strengthTest')).toBeLessThan(ids.indexOf('weekly-nearVision'))
    expect(ids.at(-1)).toBe('weekly-nearVision')
  })
})

describe('week view', () => {
  it('shows open tasks today, and done ones only if done today', () => {
    const tasks = tasksAt(at(15, 9), [
      checkIn(at(10, 8), [['strengthTest', 60]]), // done on day 10
      checkIn(at(15, 8), [['bodyMass', 70]]), // done today
    ])
    const ids = todayTasks(tasks, at(15, 9)).map((t) => t.id)
    expect(ids).toContain('weekly-bodyMass')
    expect(ids).toContain('daily')
    expect(ids).not.toContain('weekly-strengthTest')
  })

  it('lists the weekly items scheduled in the next 6 days', () => {
    const days = weekAhead(profile, at(15, 9)) // days 16–21 → slots 2–6, 0
    expect(days.map((d) => d.items)).toEqual([
      ['Fitness self-test (strength)'],
      ['Body mass'],
      ['Blood glucose (fasting)'],
      ['Cumulative mission dose'],
      ['Crew relations'],
    ])
  })

  it('counts what was done over the last 7 days', () => {
    const result = weekCompletion({
      profile,
      mission: MISSIONS.iss,
      checkIns: [
        checkIn(at(15, 8), [['mood', 4]], 'daily'),
        checkIn(at(14, 8), [['mood', 4]], 'daily'),
      ],
      events: [],
      health: computeHealth({ profile, checkIns: [], events: [] }, MISSIONS.iss, at(15, 9)),
      now: at(15, 9),
    })
    // 7 daily check-ins + 6 weekly items scheduled in days 9–15
    expect(result).toEqual({ done: 2, total: 13 })
  })
})

describe('display', () => {
  it('words each task state with an icon, and colors the bell by the most urgent task', () => {
    const fever = tasksAt(at(15, 14), [checkIn(at(15, 8), [['bodyTemperature', 38.4]])])
    const recheck = task(fever, 'recheck-bodyTemperature')!
    expect(taskDisplay(recheck, at(15, 14))).toEqual({ icon: '✖', word: 'now', tone: 'alert' })
    expect(taskDisplay(task(fever, 'weekly-strengthTest')!, at(15, 14))).toMatchObject({
      word: 'late',
    })
    expect(taskDisplay(task(tasksAt(at(15, 9)), 'daily')!, at(15, 9))).toMatchObject({
      word: 'due',
    })

    expect(bellTone(pendingTasks(fever))).toBe('alert')
    expect(bellTone(pendingTasks(tasksAt(at(15, 9))))).toBe('warn') // missed weekly items
    expect(bellTone([])).toBe('none')
  })
})
