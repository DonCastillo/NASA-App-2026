import { describe, expect, it } from 'vitest'
import { COUNTERMEASURES } from './countermeasures'
import { EVENT_TYPES } from './events'
import { SUPPLEMENTS } from './supplements'
import { SYSTEMS } from './systems'

// Content checks for the supporting data in src/data/ (plan/tasks.md 1.4).
// They check that every id one file uses actually exists in another.

const articleFiles = Object.keys(import.meta.glob('../../plan/articles/*.md'))
const knownSources = new Set(
  articleFiles.map((path) => path.split('/').pop()!.replace(/\.md$/, '')),
)
const indicatorIds = new Set(SYSTEMS.flatMap((system) => system.indicators.map((i) => i.id)))
const supplementIds = new Set(SUPPLEMENTS.map((item) => item.id))
const questionIds = new Set(COUNTERMEASURES.map((q) => q.id))

describe('countermeasure questions', () => {
  it('has the 10 questions from the plan: 5 triggered, 3 routine, 2 before landing', () => {
    expect(COUNTERMEASURES).toHaveLength(10)
    const count = (group: string) => COUNTERMEASURES.filter((q) => q.group === group).length
    expect([count('triggered'), count('routine'), count('preLanding')]).toEqual([5, 3, 2])
  })

  it('uses unique ids and offers at least two answers each', () => {
    expect(questionIds.size).toBe(COUNTERMEASURES.length)
    for (const q of COUNTERMEASURES) {
      expect(q.answers.length, q.id).toBeGreaterThanOrEqual(2)
      expect(q.askedWhen.length, q.id).toBeGreaterThan(0)
      expect(q.frequency.length, q.id).toBeGreaterThan(0)
    }
  })

  it('links routine questions only to pick-list items that exist', () => {
    for (const q of COUNTERMEASURES) {
      for (const id of q.onlyIfProfileHas ?? []) {
        expect(supplementIds.has(id), `${q.id} → ${id}`).toBe(true)
      }
    }
  })

  it('cites only articles that exist', () => {
    for (const q of COUNTERMEASURES) {
      for (const source of q.sources) expect(knownSources.has(source), source).toBe(true)
    }
  })
})

describe('supplement pick list', () => {
  it('uses unique ids and existing sources', () => {
    expect(supplementIds.size).toBe(SUPPLEMENTS.length)
    for (const item of SUPPLEMENTS) {
      for (const source of item.sources) expect(knownSources.has(source), source).toBe(true)
    }
  })

  it('has a routine question for every item', () => {
    for (const item of SUPPLEMENTS) {
      const asked = COUNTERMEASURES.some((q) => q.onlyIfProfileHas?.includes(item.id))
      expect(asked, item.id).toBe(true)
    }
  })
})

describe('event types', () => {
  it('has spacewalk, landing / docking and gravity transition', () => {
    expect(EVENT_TYPES.map((event) => event.id)).toEqual([
      'spacewalk',
      'landing',
      'gravityTransition',
    ])
  })

  it('follows up with indicators and asks questions that exist', () => {
    for (const event of EVENT_TYPES) {
      expect(event.followUpIndicators.length, event.id).toBeGreaterThan(0)
      for (const id of event.followUpIndicators) {
        expect(indicatorIds.has(id), `${event.id} → ${id}`).toBe(true)
      }
      for (const id of event.beforeEventQuestions) {
        expect(questionIds.has(id), `${event.id} → ${id}`).toBe(true)
      }
    }
  })

  it('asks the pre-landing questions before a landing', () => {
    const landing = EVENT_TYPES.find((event) => event.id === 'landing')!
    const preLanding = COUNTERMEASURES.filter((q) => q.group === 'preLanding').map((q) => q.id)
    expect(landing.beforeEventQuestions).toEqual(preLanding)
  })
})
