import { describe, expect, it } from 'vitest'
import { SYSTEMS } from '../data/systems'
import { systemSources } from './sources'

describe('systemSources', () => {
  it('lists system sources first, then indicator sources, without repeats', () => {
    const heart = systemSources(SYSTEMS.find((s) => s.id === 'heart')!)
    const slugs = heart.map((s) => s.slug)
    expect(slugs.slice(0, 4)).toEqual([
      'risk-of-cardiovascular-adaptations',
      'venous-haemostasis',
      'thigh-cuff',
      'cipher',
    ])
    expect(slugs).toContain('challenge-statement') // from blood pressure / heart rate
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('resolves every source of every system to a title (and a link for articles)', () => {
    for (const system of SYSTEMS) {
      const all = new Set([...system.sources, ...system.indicators.flatMap((i) => i.sources)])
      const resolved = systemSources(system)
      expect(resolved).toHaveLength(all.size)
      for (const source of resolved) {
        expect(source.title.length).toBeGreaterThan(0)
        if (source.slug !== 'challenge-statement') expect(source.url).toMatch(/^https:\/\//)
      }
    }
  })
})
